/**
* @description Apex controller for handling product reviews, including fetching reviews,
*              retrieving review images, and adding new reviews with attachments.
*/
public with sharing class ReviewController {
    
    /**
* @description Fetches all reviews for a given product, ordered by creation date.
* @param productId The ID of the product for which reviews are retrieved.
* @return List of ProductReview__c records.
*/
    @AuraEnabled(cacheable=true)
    public static List<ProductReview__c> getReviews(Id productId) {
        if (productId == null) {
            throw new IllegalArgumentException('Product ID must not be null.');
        }
        System.debug('Fetching reviews for Product ID: ' + productId);
        
        return [
            SELECT Id, Rating__c, Comment__c, Images__c, ReviewedBy__c
            FROM ProductReview__c
            WHERE Product__c = :productId
            ORDER BY CreatedDate DESC
        ];
    }
    
    /**
* @description Retrieves the URLs of images attached to a specific review.
* @param reviewId The ID of the review whose images are retrieved.
* @return List of image URLs.
*/
    @AuraEnabled(cacheable=true)
    public static List<String> getReviewImages(Id reviewId) {
        if (reviewId == null) {
            throw new IllegalArgumentException('Review ID must not be null.');
        }
        
        List<String> imageUrls = new List<String>();
        
        // Fetch related ContentDocumentLinks
        List<ContentDocumentLink> contentLinks = [
            SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :reviewId
        ];
        
        // Extract ContentDocument IDs
        Set<Id> contentDocIds = new Set<Id>();
        for (ContentDocumentLink link : contentLinks) {
            contentDocIds.add(link.ContentDocumentId);
        }
        
        // Retrieve latest ContentVersion for each document
        if (!contentDocIds.isEmpty()) {
            List<ContentVersion> contentVersions = [
                SELECT Id, VersionDataUrl, ContentDocumentId, FileType
                FROM ContentVersion
                WHERE ContentDocumentId IN :contentDocIds
                ORDER BY CreatedDate DESC
            ];
            
            // Construct base URL for file downloads
            String fullFileURL = URL.getOrgDomainURL().toExternalForm();
            if (fullFileURL.endsWith('/sfsites/c')) {
                fullFileURL = fullFileURL.replace('/sfsites/c', '');
            }
            
            // Generate image URLs
            for (ContentVersion cv : contentVersions) {
                if (cv.FileType == 'PNG' || cv.FileType == 'JPG' || cv.FileType == 'GIF') {
                    imageUrls.add(fullFileURL + '/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=' + cv.Id);
                }
            }
        }
        
        return imageUrls;
    }
    
    /**
* @description Adds a new review for a product, including optional image attachments.
* @param productId The ID of the product being reviewed.
* @param rating The rating given by the user.
* @param comment The comment provided by the user.
* @param loggedInUser The ID of the user submitting the review.
* @param imageUrl List of image IDs associated with the review.
*/
    @AuraEnabled
    public static void addReview(Id productId, Integer rating, String comment, Id loggedInUser, List<String> imageUrl) {
        // Validate required parameters
        if (productId == null || loggedInUser == null || rating == null) {
            throw new IllegalArgumentException('Product ID, Rating, and Logged-in User must not be null.');
        }
        
        // Create and insert the review record
        ProductReview__c review = new ProductReview__c(
            Product__c = productId,
            Rating__c = rating,
            Comment__c = comment,
            ReviewedBy__c = loggedInUser
        );
        insert review;
        System.debug('Created review with ID: ' + review.Id);
        
        // Handle image attachments
        if (!imageUrl.isEmpty()) {
            List<ContentDocumentLink> contentLinks = new List<ContentDocumentLink>();
            Set<Id> contentDocIds = new Set<Id>();
            
            for (String imageId : imageUrl) {
                if (String.isNotBlank(imageId)) {
                    ContentDocumentLink link = new ContentDocumentLink(
                        LinkedEntityId = review.Id,
                        ContentDocumentId = Id.valueOf(imageId),
                        ShareType = 'I',
                        Visibility = 'AllUsers'
                    );
                    contentLinks.add(link);
                    contentDocIds.add(Id.valueOf(imageId));
                }
            }
            
            // Insert content links
            if (!contentLinks.isEmpty()) {
                insert contentLinks;
            }
            
            // Make images publicly accessible
            List<ContentDocument> contentDocs = [
                SELECT Id, SharingPrivacy FROM ContentDocument WHERE Id IN :contentDocIds
            ];
            for (ContentDocument doc : contentDocs) {
                doc.SharingPrivacy = 'N'; 
            }
            update contentDocs;
        }
    }
}