export const logger = (message: string) => {
    console.log(
        `[${(new Date).toString().slice(0, 24)} | ${Date.now()}] - ${message}`
    )
}