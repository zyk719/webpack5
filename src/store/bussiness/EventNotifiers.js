function Notifier(evtName, func) {
    this.evtName = evtName
    this.Func = func
}

function EventNotifiers(ctrl) {
    this.Notifiers = []
    this.Control = ctrl
    this.Is_ie = false

    this.add = function(evtName, func) {
        if (this.Is_ie) {
            if (this.Control.attachEvent)
                this.Control.attachEvent(evtName, func)
            else this.Control.addEventListener(evtName, func, false)
        } else {
            this.Control[evtName].connect(func)
        }
        this.remove(evtName)
        for (let i = 0; i < this.Notifiers.length; i++) {
            if (this.Notifiers[i].evtName === evtName) {
                this.Notifiers[i].Func = func
                return
            }
        }
        this.Notifiers[this.Notifiers.length] = new Notifier(evtName, func)
    }
    this.remove = function(evtName) {
        for (let i = 0; i < this.Notifiers.length; i++) {
            if (
                this.Notifiers[i].evtName === evtName &&
                this.Notifiers[i].Func != null
            ) {
                if (this.Is_ie) {
                    if (this.Control.detachEvent)
                        this.Control.detachEvent(
                            this.Notifiers[i].evtName,
                            this.Notifiers[i].Func
                        )
                    else
                        this.Control.removeEventListener(
                            this.Notifiers[i].evtName,
                            this.Notifiers[i].Func,
                            false
                        )
                } else {
                    this.Control[evtName].disconnect(this.Notifiers[i].Func)
                }
                this.Notifiers[i].Func = null
            }
        }
    }
    this.removeAll = function() {
        for (let i = 0; i < this.Notifiers.length; i++) {
            if (this.Notifiers[i].Func != null) {
                if (this.Is_ie) {
                    if (this.Control.detachEvent)
                        this.Control.detachEvent(
                            this.Notifiers[i].evtName,
                            this.Notifiers[i].Func
                        )
                    else
                        this.Control.removeEventListener(
                            this.Notifiers[i].evtName,
                            this.Notifiers[i].Func,
                            false
                        )
                } else {
                    this.Control[this.Notifiers[i].evtName].disconnect(
                        this.Notifiers[i].Func
                    )
                }
                this.Notifiers[i].Func = null
            }
        }
        this.Notifiers.length = 0
    }
    this.isWaitingEvent = function() {
        for (let i = 0; i < this.Notifiers.length; i++) {
            if (this.Notifiers[i].Func != null) return true
        }
        return false
    }
}

export default EventNotifiers
