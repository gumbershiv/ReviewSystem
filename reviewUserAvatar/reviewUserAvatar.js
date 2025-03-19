import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

// Fields to fetch for the user record
const USER_FIELDS = ['User.Name'];

export default class ReviewUserAvatar extends LightningElement {
    @api userId;

    // Wire service to fetch user details
    @wire(getRecord, { recordId: '$userId', fields: USER_FIELDS })
    userRecord;

    /**
     * @description Retrieves the user's name; defaults to 'Unknown' if not found.
     * @returns {string} User's name or 'Unknown'
     */
    get name() {
        return this.userRecord?.data?.fields?.Name?.value || 'Unknown';
    }

    /**
     * @description Generates initials from the user's name for the avatar fallback.
     * @returns {string} Initials or 'UN' (Unknown)
     */
    get initials() {
        return this.name !== 'Unknown'
            ? this.name
                  .split(' ')
                  .map(word => word.charAt(0))
                  .join('')
                  .toUpperCase()
            : 'UN';
    }
}
