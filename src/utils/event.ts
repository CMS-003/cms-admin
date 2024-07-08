import ee from 'event-emitter'

const MyClass: any = function () { /* .. */ };
ee(MyClass.prototype);

const events: any = new MyClass()

export default events;