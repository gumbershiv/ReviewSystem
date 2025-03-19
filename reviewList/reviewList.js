import { LightningElement, api } from 'lwc';

export default class ChildComponent extends LightningElement {
    @api records = []; 

    /**
     * @description Computes the distribution of ratings (1-5) as percentages.
     * @returns {Array} - List of objects with rating, star representation, and percentage.
     */
    get ratingDistribution() {
        if (!this.records.length) {
            return [];
        }

        // Initialize rating count map
        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const totalRecords = this.records.length;

        // Count occurrences of each rating
        this.records.forEach(({ Rating__c }) => {
            if (Rating__c >= 1 && Rating__c <= 5) {
                ratingCounts[Rating__c]++;
            }
        });

        // Compute percentage for each rating
        return Object.entries(ratingCounts).map(([rating, count]) => ({
            rating: Number(rating), 
            stars: '★'.repeat(Number(rating)), 
            percentage: ((count / totalRecords) * 100).toFixed(2) 
        }));
    }
}
