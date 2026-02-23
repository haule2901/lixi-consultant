export type PrizeType = 'VOUCHER';

export interface PrizeItem {
    id: string;
    type: PrizeType;
    title: string;
    message: string;
    weight: number;
    stock?: number;
    amount?: string;
    actionLink?: string;
    code?: string;
}

export interface UserInput {
    fullName: string;
    email: string;
    phone: string;
    concern: string;
}

export interface PlayRecord {
    user: UserInput;
    prizeId: string;
    playedAt: string;
}
