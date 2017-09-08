Feature: Test if the url is a certain value
    Scenario: The url should be https://www.google.co.th/
        Given I open the site "https://www.google.co.th/"
        Then  I expect that the url is "https://www.google.co.th/"
