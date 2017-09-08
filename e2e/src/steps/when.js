import { defineSupportCode } from 'cucumber'

import clearInputField from '../implements/action/clearInputField'
import clickElement from '../implements/action/clickElement'
import closeLastOpenedWindow from '../implements/action/closeLastOpenedWindow'
import deleteCookie from '../implements/action/deleteCookie'
import dragElement from '../implements/action/dragElement'
import focusLastOpenedWindow from '../implements/action/focusLastOpenedWindow'
import handleModal from '../implements/action/handleModal'
import moveToElement from '../implements/action/moveToElement'
import pause from '../implements/action/pause'
import pressButton from '../implements/action/pressButton'
import scroll from '../implements/action/scroll'
import selectOption from '../implements/action/selectOption'
import selectOptionByIndex from '../implements/action/selectOptionByIndex'
import setCookie from '../implements/action/setCookie'
import setInputField from '../implements/action/setInputField'
import setPromptText from '../implements/action/setPromptText'
import submitForm from '../implements/action/submitForm'


defineSupportCode(({ When }) => {
    When(
        /^I (click|doubleclick) on the (link|button|element) "([^"]*)?"$/,
        clickElement
    )

    When(
        /^I (add|set) "([^"]*)?" to the inputfield "([^"]*)?"$/,
        setInputField
    )

    When(
        /^I clear the inputfield "([^"]*)?"$/,
        clearInputField
    )

    When(
        /^I drag element "([^"]*)?" to element "([^"]*)?"$/,
        dragElement
    )

    When(
        /^I submit the form "([^"]*)?"$/,
        submitForm
    )

    When(
        /^I pause for (\d+)ms$/,
        pause
    )

    When(
        /^I set a cookie "([^"]*)?" with the content "([^"]*)?"$/,
        setCookie
    )

    When(
        /^I delete the cookie "([^"]*)?"$/,
        deleteCookie
    )

    When(
        /^I press "([^"]*)?"$/,
        pressButton
    )

    When(
        /^I (accept|dismiss) the (alertbox|confirmbox|prompt)$/,
        handleModal
    )

    When(
        /^I enter "([^"]*)?" into the prompt$/,
        setPromptText
    )

    When(
        /^I scroll to element "([^"]*)?"$/,
        scroll
    )

    When(
        /^I close the last opened (window|tab)$/,
        closeLastOpenedWindow
    )

    When(
        /^I focus the last opened (window|tab)$/,
        focusLastOpenedWindow
    )

    When(
        /^I select the (\d+)(st|nd|rd|th) option for element "([^"]*)?"$/,
        selectOptionByIndex
    )

    When(
        /^I select the option with the (name|value|text) "([^"]*)?" for element "([^"]*)?"$/,
        selectOption
    )

    When(
        /^I move to element "([^"]*)?"(?: with an offset of (\d+),(\d+))*$/,
        moveToElement
    )
})
