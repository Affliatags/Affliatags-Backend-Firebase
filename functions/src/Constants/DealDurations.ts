import { Deals } from "./Deals";
import { TimePeriods } from "./TimePeroids";

export const DealDurations: Record<keyof typeof Deals, number> = Object.freeze({
    silver: TimePeriods.MONTH,
    gold: TimePeriods.SIX_MONTH,
    platinum: TimePeriods.YEAR,
    diamond: TimePeriods.TWO_YEAR,
})