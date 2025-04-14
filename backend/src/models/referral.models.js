import { v4 as uuidv4 } from 'uuid';

export class ReferralCode {
    constructor(data = {}) {
        this.id = data.id || `referral-${uuidv4()}`;
        this.type = 'referral';
        this.code = data.code;
        this.createdBy = data.createdBy;
        this.timesUsed = data.timesUsed || 0;
        this.usedBy = data.usedBy || [];
        this.status = data.status || 'active';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            code: this.code,
            createdBy: this.createdBy,
            timesUsed: this.timesUsed,
            usedBy: this.usedBy,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
} 