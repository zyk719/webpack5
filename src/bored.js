import store from '@/store'
;(() => {
    const long = 1000 * 60 * 5
    let timeId = 0

    const openLater = () =>
        setTimeout(store.commit, long, 'toggleScreenSaver', true)
    timeId = openLater()

    return () => {
        window.addEventListener(
            'click',
            () => clearTimeout(timeId) || (timeId = openLater())
        )
    }
})()()
