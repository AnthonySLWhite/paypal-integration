export function ErrorHandler(err, req, res, next) {
    try {
        const { message } = err;
        if (!message) return res.status(500).send();

        res.status(400).send({ error: message });
    } catch (error) {
        res.status(500).send({
            error: 'Unexpected server error!',
        });
    }
}
