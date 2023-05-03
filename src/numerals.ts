import moment from "moment"
import { sleep } from "./utils"
import numeral from "numeral"
import { isProd } from "./config"
import { isEmpty } from "lodash"
import Logger from "./libs/logger"

let isLocaleSet = false

let currencies: any = {}

setNumeral()

function setNumeral() {
    if (isLocaleSet) {
        return
    }
    isLocaleSet = true
    numeral.register("locale", "truck", {
        delimiters: {
            thousands: " ",
            decimal: ".",
        },
        abbreviations: {
            thousand: "k",
            million: "mil",
            billion: "bil",
            trillion: "tril",
        },
        ordinal: function (number) {
            return "."
        },
        currency: {
            symbol: "€",
        },
    })
    numeral.locale("truck")
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this
    var escapedSearch = search.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
    return target.replace(new RegExp(escapedSearch, "g"), replacement)
}

function formatPrice(value) {
    if (!value) {
        // return value
        return null
    } else if (typeof value == "number") {
        return value
    }

    let decimalKey = "DECIMAL_KEY"

    let i = value.length
    let numericsFound = 0
    while (i--) {
        let c = value.charAt(i)

        if (numericsFound <= 2) {
            // Search for cents symbol
            // If 3 digits, then it's not cents but thousands symbol
            if (c === "," || c === ".") {
                value = value.substring(0, i) + decimalKey + value.substring(i + 1)
            }
        } else {
            // Small optimisation
            break
        }

        if (c >= "0" && c <= "9") {
            numericsFound++
        }
    }

    value = value.replaceAll(".", ",")
    value = value.replaceAll(decimalKey, ".")

    let num = numeral(value).value()
    return Math.abs(num)
}

function formatNumber(value, dontReplaceDots, dotsToCommas) {
    if (!value) return null

    if (!isNaN(value)) {
        return Number(value)
    }

    // replace dots with commas
    let newValue = value
    if (!dontReplaceDots) {
        newValue = value.replaceAll(".", ",")
    }
    if (dotsToCommas) {
        newValue = value.replaceAll(",", ".")
    }
    let num = numeral(newValue).value()
    return Math.abs(num)
    // return parseInt(Math.abs(numeral(newValue)))
}

export { formatPrice, formatNumber, setNumeral }
