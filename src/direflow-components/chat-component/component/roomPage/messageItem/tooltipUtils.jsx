import { getEmojiFromUnicode } from "./emoji";
// import Skinner from './Skinner';

/**
 * Returns the shortcode for an emoji character.
 *
 * @param {String} char The emoji character
 * @return {String} The shortcode (such as :thumbup:)
 */
export function unicodeToShortcode(char) {
  const shortcodes = getEmojiFromUnicode(char)?.shortcodes;
  return shortcodes?.length ? `:${shortcodes[0]}:` : "";
}

/**
 * Joins an array into one value with a joiner. E.g. join(["hello", "world"], " ") -> <span>hello world</span>
 * @param array the array of element to join
 * @param joiner the string/JSX.Element to join with
 * @returns the joined array
 */
export function jsxJoin(array, joiner) {
  const newArray = [];
  array.forEach((element, index) => {
    newArray.push(element, (index === array.length - 1) ? null : joiner);
  });
  return (
    // <span>{ newArray }</span>
    { newArray }
  );
}

export function _t(str) {
	return str
}

/**
 * Constructs a written English string representing `items`, with an optional
 * limit on the number of items included in the result. If specified and if the
 * length of `items` is greater than the limit, the string "and n others" will
 * be appended onto the result. If `items` is empty, returns the empty string.
 * If there is only one item, return it.
 * @param {string[]} items the items to construct a string from.
 * @param {number?} itemLimit the number by which to limit the list.
 * @returns {string} a string constructed by joining `items` with a comma
 * between each item, but with the last item appended as " and [lastItem]".
 */
export function formatCommaSeparatedList(items, itemLimit) {
	const remaining = itemLimit === undefined ? 0 : Math.max(
		items.length - itemLimit, 0,
	);
	if (items.length === 0) {
		return "";
	} else if (items.length === 1) {
		return items[0];
	} else {
		let lastItem;
		if (remaining > 0) {
			items = items.slice(0, itemLimit);
		} else {
			lastItem = items.pop();
		}

		let joinedItems;
		if (items.every(e => typeof e === "string")) {
			joinedItems = items.join(", ");
		} else {
			joinedItems = jsxJoin(items, ", ");
		}

		if (remaining > 0) {
			// return _t("%(items)s and %(count)s others", { items: joinedItems, count: remaining } );
			return items.join('--') + ' and ' + remaining + ' others';
		} else {
			// return _t("%(items)s and %(lastItem)s", { items: joinedItems, lastItem });
			return items.join('--') + ' and ' + lastItem;
		}
	}
}

/**
 * Replaces a component with a skinned version if a skinned version exists.
 * This decorator should only be applied to components which can be skinned. For
 * the react-sdk this means all components should be decorated with this.
 *
 * The decoration works by assuming the skin has been loaded prior to the
 * decorator being called. If that's not the case, the developer will find
 * out quickly through various amounts of errors and explosions.
 *
 * For a bit more detail on how this works, see docs/skinning.md
 * @param {string} name The dot-path name of the component being replaced.
 * @param {React.Component} origComponent The component that can be replaced
 * with a skinned version. If no skinned version is available, this component
 * will be used. Note that this is automatically provided to the function and
 * thus is optional for purposes of types.
 * @returns {ClassDecorator} The decorator.
 */
// export function replaceableComponent(name, origComponent) {
// 	// Decorators return a function to override the class (origComponent). This
// 	// ultimately assumes that `getComponent()` won't throw an error and instead
// 	// return a falsey value like `null` when the skin doesn't have a component.
// 	return () => getComponent(name) || origComponent;
// }

// export function getComponent(componentName) {
//   return Skinner.getComponent(componentName);
// }
