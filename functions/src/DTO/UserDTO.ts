import { User } from "../Model/User";

export class UserDTO {
    constructor(
        public profilePhoto: string | null,
        public username: string,
        public creationDate: number
    ){ }

    public static fromUser(user: User): UserDTO{
        return new UserDTO(
            user.profilePhoto,
            user.username,
            user.creationDate,
        )
    }
}