const asyncHandler = (requestHandeler) => () => {
    (req,res,next) => {
        Promise.resolve(requestHandeler(req,res,next)).catch((error) => next(error));
    }
}

export { asyncHandler}




