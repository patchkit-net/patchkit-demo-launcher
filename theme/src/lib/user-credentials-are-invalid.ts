export class UserCredentialsAreInvalid extends Error {
  constructor() {
    super();
    this.name = "UserCredentialsAreInvalid";
    Object.setPrototypeOf(this, UserCredentialsAreInvalid.prototype);
  }
}
