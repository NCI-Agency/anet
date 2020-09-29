# Contributing to this project

Anybody is welcome to create a branch on this repository and make edits.  If you'd like to have your code merged back into the master branch, please ensure you do the following before opening the pull request:

### Code Style

Our code style conventions are automatically checked on both the Java server side and the Javascript client side.  You can run these checks with: 

- Java Checkstyle `./gradlew check`
- JS Lint `./gradlew yarn_run_lint`

### Testing

Before we merge any code into master we verify that all tests run.  You can run these yourself with: 

- Backend Unit Tests `export DB_DRIVER='sqlserver'; ./gradlew -PtestEnv test`
- Front-end Integration Tests `./gradlew yarn_run_test-all`

If you are adding any new features, please write test cases that cover your features. 

### The legal stuff

When you submit a pull request to this repository for the first time, you need to sign a Developer Certificate of Origin ("DCO"). To read and agree to the DCO, you'll add your name and email address to `Contributors.md`. At a high level, it tells us that you have the right to submit the work you're contributing in your pull requests and says that you consent to us treating the contribution in a way consistent with the license associated with this software and its documentation ("Project"). You can read the license associated with this project in `LICENSE.md`. 

You can submit contributions anonymously or under a pseudonym if you'd like, but we need to be able to reach you at the email address you list when you agree to the DCO. 

It probably goes without saying, but contributions you make to this public Department of Defense repository are completely voluntary. When you submit a pull request, you're offering your contribution without expectation of payment and you expressly waive any future pay claims against the U.S. Federal government related to your contribution. 

### Open a Pull Request

Once your branch is ready to be merged please open a pull request and assign it to one of the repository admins.  (Currently @hunterp and @nickjs).  
