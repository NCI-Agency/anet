# Setting up Data Import Framework

## Changes in localSettings.gradle file 
- If you want to use jupyter lab instead of jupyter notebook use following in your `localSettings.gradle` file (default jupyter notebook).
    ```
    run.environment("JUPYTER_ENABLE_LAB", "yes")
    ```
- If you want to specify port you will use jupyter, use following in your `localSettings.gradle` file (default port is 5000).
    ```
    run.environment("ANET_JUPYTER_PORT", "<port_number>")
    ```

## Setting up Environment
- Pull the Jupyter Docker image: `./gradlew dockerPullJupyter`
- Create the Jupyter Docker container: `./gradlew dockerCreateJupyter`
- Start the Jupyter Docker container: `./gradlew dockerStartJupyter`
- Wait until the container is fully started, then run `./gradlew dockerInstallJupyterDependencies` to install dependencies by using pipfile.
- Open browser and type following to addressbar `localhost:<port_number>`
- Type `anet` in token area and press enter.