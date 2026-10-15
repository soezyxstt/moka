import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const namedColors = "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen".split(" ").join("|");

// Scan source text, including dormant routes and CSS modules, so new callers stay themeable.
export function colorViolations(source: string): string[] {
  const patterns = [
    /#[\da-f]{3,8}\b/gi,
    /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\((?!\s*from\s+var\()/gi,
    /\b(?:text|bg|border(?:-[trblxyse])?|divide|ring(?:-offset)?|outline|shadow|drop-shadow|from|via|to|fill|stroke|decoration|accent|caret|placeholder)-(?:white|black|(?:slate|gray|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d+)?|dgb(?:-\d+)?|fb(?:-\d+)?)\b/g,
    /(?:--color-(?:dgb|fb)(?:-\d+)?|\b(?:color|backgroundColor|background|fill|stroke|borderColor)\s*[:=]\s*["'](?:white|black|red|green|blue|gray|grey|orange|yellow|purple|pink)\b)/g,
    /\[(?:[^\]\s]*[_ ,])?(?:white|black|red|blue|green|gray|grey)(?:[_ ,\]]|$)/g,
    new RegExp(`(?:\\b(?:color|backgroundColor|background|fill|stroke|borderColor)\\s*[:=]\\s*["']?(?:${namedColors})(?=["';,}\\s]|$)|\\[(?:[^\\]\\n]*[_ ,:(])?(?:${namedColors})(?=[_ ,;)\\]]))`, "gi"),
    new RegExp(`\\b(?:repeating-)?(?:linear|radial|conic)-gradient\\([^;"'\\n]*(?:[,( ]|_)(?:${namedColors})(?=[, )_\\d])`, "gi"),
  ];
  return patterns.flatMap((pattern) => Array.from(source.matchAll(pattern), (match) => match[0]));
}

export function auditColorSource(root: string): string[] {
  const failures: string[] = [];
  function visit(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (/\.(?:[cm]?[jt]sx?|css|scss|svg|html)$/.test(entry.name)) {
        const file = relative(root, path).replaceAll("\\", "/");
        if (file === "app/globals.css") continue;
        readFileSync(path, "utf8").split(/\r?\n/).forEach((line, index) => {
          for (const violation of colorViolations(line)) failures.push(`${file}:${index + 1}: ${violation}`);
        });
      }
    }
  }
  visit(root);
  return failures;
}
