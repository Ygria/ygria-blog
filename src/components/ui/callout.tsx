import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import {
  Check,

  Flame,
  Info,
  Quote,
  TriangleAlert,
  Zap,
} from "lucide-react";
import {
  forwardRef,
  isValidElement,
  Children,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import type { ReactElement } from "react";

const typeIconMap: Record<CalloutType, ReactNode> = {
  info: <Info className="size-5 fill-blue-500 text-white mt-[4px]" />,
  warn: (
    <TriangleAlert className="size-5 fill-orange-500 text-fd-card mt-[4px]" />
  ),
  error: (
    <Zap className="size-5 stroke-red-500 text-red-500 fill-red-50 text-fd-card mt-[4px]" />
  ),
  default: <Info className="size-5 fill-gray-500 text-fd-card mt-[4px]" />,
  success: <Check className="size-5 text-green-500 mt-[4px]" />,
  hint: <Flame className="size-5 text-green-500 mt-[4px]" />,
  tip: <Flame className="size-5 text-green-500 mt-[4px]" />,
  cite: <Quote className="size-5 text-gray-500 fill-gray-50 text-fd-card mt-[4px]" />,
};

const titleClassMap: Record<CalloutType, string> = {
  info: "font-semibold text-blue-600",
  warn: "text-orange-600",
  error: "text-red-600 font-semibold",
  default: "text-gray-600",
  success: "text-green-600",
  hint: "",
  tip: "",
  cite: "font-bold text-gray-600",
};

type CalloutType =
  | "info"
  | "warn"
  | "error"
  | "success"
  | "default"
  | "hint"
  | "tip"
  | "cite";

type CalloutProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "type" | "icon"
> & {
  title?: ReactNode;
  type?: CalloutType;
  icon?: ReactNode;
};

const calloutVariants = cva(
  "my-4 flex flex-row gap-2 rounded-lg border border-s-2 bg-fd-card p-6 text-fd-card-foreground shadow-md",
  {
    variants: {
      type: {
        info: "border-s-blue-500/50 bg-blue-50",
        warn: "border-s-orange-500/50",
        error: "border-s-red-500/50 bg-red-50",
        default: "border-s-gray-400/50",
        success: "border-s-green-400/50",
        hint: "border-s-green-400/50",
        tip: "border-s-green-400/50",
        cite: "border-s-gray-400/50 bg-gray-50",
      },
    },
  }
);

export const Callout = forwardRef<HTMLDivElement, CalloutProps>(
  ({ className, children, title, type = "info", icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(calloutVariants({ type }), className)}
        {...props}
      >
        {icon ?? typeIconMap[type]}
        <div className="min-w-0 flex flex-col gap-2 flex-1 text-base/8">
          {title ? (
            <p className={cn(titleClassMap[type], "font-medium !my-0")}>
              {title}
            </p>
          ) : null}
          {/* * 修改点：确保 children 不是空的，并且有内容时才渲染，避免不必要的 div
           * The original `prose-no-margin empty:hidden` classes are good.
           */}
          <div className="text-fd-muted-foreground prose-no-margin empty:hidden text-base/8">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

Callout.displayName = "Callout";

// 转换 ReactNode 到纯文本
function childrenToString(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return Children.toArray(children)
      .map((child) => childrenToString(child))
      .join("");
  }
  if (isValidElement(children)) {
    const element = children as ReactElement<any>;
    return childrenToString(element.props.children);
  }
  return "";
}

// 解析形如 [!note] title 的格式
function parseObsidianCalloutLine(line: string) {
  const regex = /^\[!(\w+)\](.*)$/i;
  const match = line.trim().match(regex);
  if (!match) {
    return { isCallout: false, type: "default", title: "" };
  }

  return {
    isCallout: true,
    type: match[1].toLowerCase(),
    title: match[2].trim(),
  };
}

// 类型映射
const typeMap: Record<string, CalloutType> = {
  info: "info",
  note: "info",
  todo: "info",
  warn: "warn",
  warning: "warn",
  caution: "warn",
  error: "error",
  danger: "error",
  check: "success",
  success: "success",
  done: "success",
  hint: "hint",
  tip: "tip",
  important: "tip",
  cite: "cite",
};

// 默认标题
const defaultTitleMap: Record<CalloutType, string> = {
  info: "Note",
  warn: "Warning",
  error: "Error",
  success: "Success",
  default: "Note",
  hint: "Hint",
  tip: "Tip",
  cite: "Citation",
};

export const ObsidianCallout = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => {
  const childArray = Children.toArray(children);
  console.log("ObsidianCallout children:", childArray);

  const filteredChildren = childArray.filter((child): child is ReactElement  => {
    return !(typeof child === "string" && child.trim().length === 0);
  });

  const firstParagraph = filteredChildren.find((child) => {
    if (!isValidElement(child)) return false;

    const element = child as ReactElement<any>;
    const text = childrenToString(element.props.children);
    return /^\[!(\w+)\]/.test(text.trim());
  });



  console.log("Obisidian first paragraph:", firstParagraph);

  if (!firstParagraph) {
    return (
      <Callout ref={ref} type="default" {...props}>
        {children}
      </Callout>
    );
  }
  const firstElement = firstParagraph as ReactElement<any>;

  const fullText = childrenToString(firstElement.props.children).trim();
  const [firstLine, ...restLines] = fullText.split(/\r?\n/);

  const result = parseObsidianCalloutLine(firstLine);
  console.log("ObsidianCallout result:", result);
  debugger;

  if (!result.isCallout) {
    return (
      <Callout ref={ref} type="default" {...props}>
        {children}
      </Callout>
    );
  }

  const mappedType = typeMap[result.type] ?? "default";
  const title = result.title || defaultTitleMap[mappedType];

  const restText = [...restLines].join("\n").trim();

  // 构造新的子节点
  const newChildren = [...childArray];
  const idx = newChildren.indexOf(firstParagraph);

  if (restText.length > 0 && isValidElement(firstParagraph)) {
    // 替换第一段内容为剩余正文
    const newFirst = <p key="replaced-paragraph">{restText}</p>;
    newChildren.splice(idx, 1, newFirst);
  } else {
    // 删除第一段
    newChildren.splice(idx, 1);
  }

  return (
    <Callout ref={ref} title={title} type={mappedType} {...props}>
      {newChildren}
    </Callout>
  );
});

ObsidianCallout.displayName = "ObsidianCallout";
