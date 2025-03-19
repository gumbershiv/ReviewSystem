import { LightningElement, api, wire, track } from 'lwc';
import getReviewImages from '@salesforce/apex/ReviewController.getReviewImages';

export default class ReviewImages extends LightningElement {
    @api reviewId; 
    @track imageUrls = [];
    isLoading = true;

    // Fetch review images from Apex controller
    @wire(getReviewImages, { reviewId: '$reviewId' })
    wiredImages({ data }) {
        this.isLoading = false;
        this.imageUrls = data?.length ? [...data] : [];
    }
}
