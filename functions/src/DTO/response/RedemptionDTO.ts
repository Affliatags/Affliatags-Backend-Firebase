import { Redemption } from "../../Model/Redemption";

export class RedemptionDTO {
    constructor(
        public totalRedemptions: number,
        public redemptions: Array<Redemption>
    ){ }
}