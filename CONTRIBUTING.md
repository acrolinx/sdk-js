# Contributing to this SDK

## Set up your local environment

1. Check out the project

2. To successfully run the integration tests you need to setup local environment variables:

    |Key|Description|
    |---|-----------|
    TEST_SERVER_URL|Acrolinx Server URL to connect|
    SSO_USERNAME|Username for Single Sign On request
    SSO_GENERIC_TOKEN|Single Sign On Token
    ACROLINX_API_TOKEN|API Token for specified username (ACROLINX_API_USERNAME)
    ACROLINX_API_USERNAME|Username to log in to Acrolinx server|
    </br>

3. Please add new features using the `master` branch, or submit a pull request. To install dependencies, build, and test the project, run:

     ```bash
    npm i
    npm run ci
    ```
    Also run the same command before pushing your changes to repository.

4. To run tests locally you can run the command
    ```
    npm run test
    ```
