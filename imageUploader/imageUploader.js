import { LightningElement, api, track } from 'lwc';

export default class ImageUploader extends LightningElement {
    @api recordId;  
    @track uploadedFiles = [];  

    /**
     * @description Handles file upload completion.
     * @param {Event} event - File upload finished event.
     */
    handleUploadFinished(event) {
        const newFiles = event.detail.files.map(file => {
            const extension = file.name.split('.').pop().toLowerCase();
            return {
                id: file.documentId,
                name: file.name, // Display only file name
                icon: this.getFileIcon(extension) 
            };
        });

        this.uploadedFiles = [...this.uploadedFiles, ...newFiles];

        // Dispatch file IDs to parent
        this.dispatchEvent(new CustomEvent('imagesuploaded', { 
            detail: { fileIds: newFiles.map(file => file.id) } 
        }));
    }

    /**
     * @description Returns the Lightning icon name based on file extension.
     * @param {String} extension - File extension.
     * @returns {String} - Lightning icon name.
     */
    getFileIcon(extension) {
        const iconMap = {
            png: 'doctype:image',
            jpg: 'doctype:image',
            jpeg: 'doctype:image',
            default: 'doctype:unknown'
        };
        return iconMap[extension] || iconMap.default;
    }
}
