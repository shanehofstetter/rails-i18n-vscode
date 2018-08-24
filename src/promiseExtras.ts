export function raceSuccess(promises, onAllRejected: (errors) => Promise<any>) {
    return Promise.all(promises.map(p => {
        return p.then(
            val => Promise.reject(val),
            err => Promise.resolve(err)
        );
    })).then(
        errors => onAllRejected(errors),
        val => Promise.resolve(val)
    );
}