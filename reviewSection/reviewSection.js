import { LightningElement, wire, track } from 'lwc';
import getReviews from '@salesforce/apex/ReviewController.getReviews';
import addReview from '@salesforce/apex/ReviewController.addReview';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { CurrentPageReference } from 'lightning/navigation';
import userId from '@salesforce/user/Id';

export default class ParentComponent extends LightningElement {
    @track rating = 0;
    @track comment = '';
    productId;
    isLoading = false;
    hasUserCommented = false;
    wiredReviews;
    records = [];
    uploadedImageIds = [];
    ratingError = false;
    commentError = false;

    @wire(CurrentPageReference)
    setPageReference(pageRef) {
        this.productId = pageRef?.state?.productId || this.extractProductIdFromUrl();
    }

    extractProductIdFromUrl() {
        return window.location.pathname.split('/').pop();
    }

    @wire(getReviews, { productId: '$productId' })
    wiredReviewsMethod(result) {
        this.wiredReviews = result;
        if (result.data) {
            this.records = result.data;
            this.checkUserCommented();
        } else if (result.error) {
            console.error('Error fetching reviews:', result.error);
        }
    }

    checkUserCommented() {
        this.hasUserCommented = this.records.some(review => review.ReviewedBy__c === userId);
    }

    handleRatingClick(event) {
        this.rating = event.detail;
        this.ratingError = false; // Remove error when valid input is received
    }

    handleCommentChange(event) {
        this.comment = event.target.value;
        this.commentError = false; // Remove error when valid input is received
    }

    handleImagesUploaded(event) {
        this.uploadedImageIds = event.detail.fileIds;
    }

    get isSubmitDisabled() {
        return !this.rating || !this.comment.trim();
    }

    async handleSubmit() {
        this.ratingError = !this.rating;
        this.commentError = !this.comment.trim();

        if (this.ratingError || this.commentError) {
            return;
        }

        this.isLoading = true;

        try {
            await addReview({
                productId: this.productId,
                rating: this.rating,
                comment: this.comment,
                loggedInUser: userId,
                imageUrl: this.uploadedImageIds
            });

            this.showToast('Success', 'Review added successfully', 'success');

            this.comment = '';
            this.uploadedImageIds = [];

            await refreshApex(this.wiredReviews);
        } catch (error) {
            this.showToast('Error', 'Failed to add review', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
