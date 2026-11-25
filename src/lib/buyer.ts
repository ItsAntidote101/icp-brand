// How the product refers to the person a client works with.
//
// The product names the role, not a person: clients see "your media buyer"
// everywhere (report page, dashboard, emails). The founder is named only on
// the About page. If clients are later assigned a named buyer, look the name
// up per client and pass it where these constants are used today.
export const BUYER_NAME = 'Your media buyer'          // as a title, or at the start of a sentence
export const BUYER = 'your media buyer'               // inside a sentence
export const BUYER_INITIALS = 'MB'
export const BUYER_TITLE = 'Dedicated to your account'

/** Capital first letter, for a buyer label that opens a sentence. */
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
