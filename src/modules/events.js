const Event = (function () {
    let participants = [];

    const invoke = function (ref, data) {
        participants.forEach(participant => {
            if (participant.ref === ref) {
                participant.callback(data);
            }
        });
    };

    const receive = function (ref, callback) {
        participants.push({ ref: ref, callback: callback });
    };

    return {
        invoke: invoke,
        receive: receive
    };
})();