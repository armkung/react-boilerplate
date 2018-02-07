import { defineSupportCode } from 'cucumber'

import checkContainsAnyText from '../implements/check/checkContainsAnyText'
import checkIsEmpty from '../implements/check/checkIsEmpty'
import checkContainsText from '../implements/check/checkContainsText'
import checkCookieContent from '../implements/check/checkCookieContent'
import checkCookieExists from '../implements/check/checkCookieExists'
import checkDimension from '../implements/check/checkDimension'
import checkElementExists from '../implements/check/checkElementExists'
import checkEqualsText from '../implements/check/checkEqualsText'
import checkModal from '../implements/check/checkModal'
import checkOffset from '../implements/check/checkOffset'
import checkProperty from '../implements/check/checkProperty'
import checkSelected from '../implements/check/checkSelected'
import checkTitle from '../implements/check/checkTitle'
import checkUrl from '../implements/check/checkURL'
import closeAllButFirstTab from '../implements/action/closeAllButFirstTab'
import compareText from '../implements/check/compareText'
import isEnabled from '../implements/check/isEnabled'
import isVisible from '../implements/check/isVisible'
import openWebsite from '../implements/action/openWebsite'
import resizeScreenSize from '../implements/action/resizeScreenSize'


defineSupportCode(({ Given }) => {
    Given(
        /^I open the (url|site) "([^"]*)?"$/,
        openWebsite
    )

    Given(
        /^the element "([^"]*)?" is( not)* visible$/,
        isVisible
    )

    Given(
        /^the element "([^"]*)?" is( not)* enabled$/,
        isEnabled
    )

    Given(
        /^the element "([^"]*)?" is( not)* selected$/,
        checkSelected
    )

    Given(
        /^the checkbox "([^"]*)?" is( not)* checked$/,
        checkSelected
    )

    Given(
        /^there is (an|no) element "([^"]*)?" on the page$/,
        checkElementExists
    )

    Given(
        /^the title is( not)* "([^"]*)?"$/,
        checkTitle
    )

    Given(
        /^the element "([^"]*)?" contains( not)* the same text as element "([^"]*)?"$/,
        compareText
    )

    Given(
        /^the element "([^"]*)?"( not)* matches the text "([^"]*)?"$/,
        checkEqualsText
    )

    Given(
        /^the element "([^"]*)?"( not)* contains the text "([^"]*)?"$/,
        checkContainsText
    )

    Given(
        /^the element "([^"]*)?"( not)* contains any text$/,
        checkContainsAnyText
    )

    Given(
        /^the element "([^"]*)?" is( not)* empty$/,
        checkIsEmpty
    )

    Given(
        /^the page url is( not)* "([^"]*)?"$/,
        checkUrl
    )

    Given(
        /^the( css)* attribute "([^"]*)?" from element "([^"]*)?" is( not)* "([^"]*)?"$/,
        checkProperty
    )

    Given(
        /^the cookie "([^"]*)?" contains( not)* the value "([^"]*)?"$/,
        checkCookieContent
    )

    Given(
        /^the cookie "([^"]*)?" does( not)* exist$/,
        checkCookieExists
    )

    Given(
        /^the element "([^"]*)?" is( not)* ([\d]+)px (broad|tall)$/,
        checkDimension
    )

    Given(
        /^the element "([^"]*)?" is( not)* positioned at ([\d]+)px on the (x|y) axis$/,
        checkOffset
    )

    Given(
        /^I have a screen that is ([\d]+) by ([\d]+) pixels$/,
        resizeScreenSize
    )

    Given(
        /^I have closed all but the first (window|tab)$/,
        closeAllButFirstTab
    )

    Given(
        /^a (alertbox|confirmbox|prompt) is( not)* opened$/,
        checkModal
    )
})
