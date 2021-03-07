// Via: https://gist.github.com/yidas/41cc9272d3dff50f3c9560fb05e7255e#:~:text=The%20exchange%20of%20new%20line,replace%20to%20handle%20the%20swap.

/**
 * This function is same as PHP's nl2br() with default parameters.
 *
 * @param {string} str Input text
 * @param {boolean} replaceMode Use replace instead of insert
 * @param {boolean} isXhtml Use XHTML
 * @return {string} Filtered text
 */
export const nl2br = (str: string, replaceMode = false, isXhtml = false) => {
    const breakTag = isXhtml ? "<br />" : "<br>";
    const replaceStr = replaceMode ? "$1" + breakTag : "$1" + breakTag + "$2";
    return (str + "").replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, replaceStr);
};
