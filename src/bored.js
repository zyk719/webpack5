import store from '@/store'
import { SCREEN_SAVER_INTERVAL } from '@/config'
;(() => {
    let timeId = 0

    const openLater = () =>
        setTimeout(
            store.commit,
            SCREEN_SAVER_INTERVAL / 2,
            'toggleScreenSaver',
            true
        )

    timeId = openLater()

    return () => {
        window.addEventListener(
            'click',
            () => clearTimeout(timeId) || (timeId = openLater())
        )
    }
})()()
