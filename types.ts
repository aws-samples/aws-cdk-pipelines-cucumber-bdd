export interface DeployEnvironment {
  /**
   * Designated name of environment.
   * @example Dev, Pre-Prod, Prod
   */
  environment: string;
  /**
   * The account number to deploy to.
   */
  account: string;
  /**
   * The region to deploy to.
   */
  region: string;
}
