
export function getNakshatraPada(longitude) {
    const nakshatraLength = 360 / 27;
    const padaLength = nakshatraLength / 4;
    const nakshatraNumber = Math.floor(longitude / nakshatraLength);
    const nakshatraLongitude = longitude % nakshatraLength;
    const pada = Math.floor(nakshatraLongitude / padaLength) + 1;
    return { nakshatraNumber, pada };
}
