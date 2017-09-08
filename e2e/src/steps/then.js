import { defineSupportCode } from 'cucumber'

import checkClass from '../implements/check/checkClass'
import checkContainsAnyText from '../implements/check/checkContainsAnyText'
import checkIsEmpty from '../implements/check/checkIsEmpty'
import checkContainsText from '../implements/check/checkContainsText'
import checkCookieContent from '../implements/check/checkCookieContent'
import checkCookieExists from '../implements/check/checkCookieExists'
import checkDimension from '../implements/check/checkDimension'
import checkEqualsText from '../implements/check/checkEqualsText'
import checkFocus from '../implements/check/checkFocus'
import checkInURLPath from '../implements/check/checkInURLPath'
import checkIsOpenedInNewWindow from
    '../implements/check/checkIsOpenedInNewWindow'
import checkModal from '../implements/check/checkModal'
import checkModalText from '../implements/check/checkModalText'
import checkNewWindow from '../implements/check/checkNewWindow'
import checkOffset from '../implements/check/checkOffset'
import checkProperty from '../implements/check/checkProperty'
import checkSelected from '../implements/check/checkSelected'
import checkTitle from '../implements/check/checkTitle'
import checkURL from '../implements/check/checkURL'
import checkURLPath from '../implements/check/checkURLPath'
import checkWithinViewport from '../implements/check/checkWithinViewport'
import compareText from '../implements/check/compareText'
import isEnabled from '../implements/check/isEnabled'
import isExisting from '../implements/check/isExisting'
import isVisible from '../implements/check/isVisible'
import waitFor from '../implements/action/waitFor'
import waitForVisible from '../implements/action/waitForVisible'
import checkIfElementExists from '../implements/lib/checkIfElementExists'


defineSupportCode(({ Then }) => {
    Then(
        /^I expect that the title is( not)* "([^"]*)?"$/,
        checkTitle
    )

    Then(
        /^I expect that element "([^"]*)?" does( not)* appear exactly "([^"]*)?" times$/,
        checkIfElementExists
    )

    Then(
        /^I expect that element "([^"]*)?" is( not)* visible$/,
        isVisible
    )

    Then(
        /^I expect that element "([^"]*)?" becomes( not)* visible$/,
        waitForVisible
    )

    Then(
        /^I expect that element "([^"]*)?" is( not)* within the viewport$/,
        checkWithinViewport
    )

    Then(
        /^I expect that element "([^"]*)?" does( not)* exist$/,
        isExisting
    )

    Then(
        /^I expect that element "([^"]*)?"( not)* contains the same text as element "([^"]*)?"$/,
        compareText
    )

    Then(
        /^I expect that element "([^"]*)?"( not)* matches the text "([^"]*)?"$/,
        checkEqualsText
    )

    Then(
        /^I expect that element "([^"]*)?"( not)* contains the text "([^"]*)?"$/,
        checkContainsText
    )

    Then(
        /^I expect that element "([^"]*)?"( not)* contains any text$/,
        checkContainsAnyText
    )

    Then(
        /^I expect that element "([^"]*)?" is( not)* empty$/,
        checkIsEmpty
    )

    Then(
        /^I expect that the url is( not)* "([^"]*)?"$/,
        checkURL
    )

    Then(
        /^I expect that the path is( not)* "([^"]*)?"$/,
        checkURLPath
    )

    Then(
        /^I expect the url to( not)* contain "([^"]*)?"$/,
        checkInURLPath
    )

    Then(
        /^I expect that the( css)* attribute "([^"]*)?" from element "([^"]*)?" is( not)* "([^"]*)?"$/,
        checkProperty
    )

    Then(
        /^I expect that checkbox "([^"]*)?" is( not)* checked$/,
        checkSelected
    )

    Then(
        /^I expect that element "([^"]*)?" is( not)* selected$/,
        checkSelected
    )

    Then(
        /^I expect that element "([^"]*)?" is( not)* enabled$/,
        isEnabled
    )

    Then(
        /^I expect that cookie "([^"]*)?"( not)* contains "([^"]*)?"$/,
        checkCookieContent
    )

    Then(
        /^I expect that cookie "([^"]*)?"( not)* exists$/,
        checkCookieExists
    )

    Then(
        /^I expect that element "([^"]*)?" is( not)* ([\d]+)px (broad|tall)$/,
        checkDimension
    )

    Then(
        /^I expect that element "([^"]*)?" is( not)* positioned at ([\d]+)px on the (x|y) axis$/,
        checkOffset
    )

    Then(
        /^I expect that element "([^"]*)?" (has|does not have) the class "([^"]*)?"$/,
        checkClass
    )

    Then(
        /^I expect a new (window|tab) has( not)* been opened$/,
        checkNewWindow
    )

    Then(
        /^I expect the url "([^"]*)?" is opened in a new (tab|window)$/,
        checkIsOpenedInNewWindow
    )

    Then(
        /^I expect that element "([^"]*)?" is( not)* focused$/,
        checkFocus
    )

    Then(
        /^I wait on element "([^"]*)?"(?: for (\d+)ms)*(?: to( not)* (be checked|be enabled|be selected|be visible|contain a text|contain a value|exist))*$/,
        {
            wrapperOptions: {
                retry: 3,
            },
        },
        waitFor
    )

    Then(
        /^I expect that a (alertbox|confirmbox|prompt) is( not)* opened$/,
        checkModal
    )

    Then(
        /^I expect that a (alertbox|confirmbox|prompt)( not)* contains the text "([^"]*)?"$/,
        checkModalText
    )
})
