export function generateImport(basePath, filename) {
    return name => {
        return require(basePath + name + filename).default
    };
}
