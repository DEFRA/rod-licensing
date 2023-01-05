/**
 * This is the main page controller.
 * It is a state machine
 */
import { nextPage } from '../routes/next-page.js'
export default async (request, h) => h.redirectWithLanguageCode(await nextPage(request))
