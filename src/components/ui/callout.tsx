import { CircleX, Info, TriangleAlert, Check ,Flame} from 'lucide-react';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

type CalloutType = 'info' | 'warn' | 'error' | 'success' | 'default' | 'hint' | 'tip';

type CalloutProps = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'type' | 'icon'> & {
    title?: ReactNode;
    type?: CalloutType;
    icon?: ReactNode;
};

const calloutVariants = cva(
    'my-4 flex flex-row gap-2 rounded-lg border border-s-2 bg-fd-card p-6  text-fd-card-foreground shadow-md',
    {
        variants: {
            type: {
                info: 'border-s-blue-500/50',
                warn: 'border-s-orange-500/50',
                error: 'border-s-red-500/50',
                default: 'border-s-gray-400/50',
                success: 'border-s-green-400/50',
                hint: 'border-s-green-400/50',
                tip: 'border-s-green-400/50'
            }
           
        },
    },
);

const typeIconMap: Record<CalloutType, ReactNode> = {
    info: <Info className="size-5  fill-blue-500 text-white mt-[4px]" />,
    warn: <TriangleAlert className="size-5 fill-orange-500 text-fd-card mt-[4px]" />,
    error: <CircleX className="size-5 fill-red-500 text-fd-card mt-[4px]" />,
    default: <Info className="size-5 fill-gray-500 text-fd-card mt-[4px]" />,
    success: <Check className="size-5  text-green-500 mt-[4px]" />,
    hint: <Flame className="size-5  text-green-500 mt-[4px]" />,
    tip: <Flame className="size-5  text-green-500 mt-[4px]" />
};

const titleClassMap : Record<CalloutType, string> = {
    info: "font-semibold",
    warn: "text-orange-600",
    error: "text-red-600",
    default: "text-gray-600",
    success: "text-green-600",
    hint: '',
    tip: ''
}


export const Callout = forwardRef<HTMLDivElement, CalloutProps>(
    ({ className, children, title, type = 'info', icon, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(calloutVariants({ type }), className)}
                {...props}
            >
                {icon ?? typeIconMap[type]}
                <div className="min-w-0 flex flex-col gap-2 flex-1 text-base/8">
                    {title ? <p className={cn(titleClassMap[type], 'font-medium !my-0')} >{title}</p> : null}
                    <div className="text-fd-muted-foreground prose-no-margin empty:hidden text-base/8">
                        {children}
                    </div>
                </div>
            </div>
        );
    },
);

Callout.displayName = 'Callout';

// ====== 新增！用于适配 Obsidian 的 blockquote ======

// import { isValidElement } from 'react';

function parseObsidianCallout(calloutString: string) {
    if (!calloutString || typeof calloutString !== 'string') {
        return {
            type: "unknown",
            title: "parse error"
        }
    }
    // 修改后的正则表达式:
    // ^\[!(\w+)\] - 匹配开始的 "[!type]"
    // \s* - 匹配可选的空格
    // ([^\n]+)   - 捕获组 2: 匹配一个或多个 *非* 换行符的字符 (标题)
    // 不再需要末尾的 $
    const regex = /^\[!(\w+)\]\s*([^\n]+)/;

    const match = calloutString.match(regex); // 使用 match 或 exec 都可以

    if (match) {
        // match[1] 是类型 "check"
        // match[2] 是标题 " 恨中录" (注意，如果 ] 和标题间有空格，\s* 会匹配掉，但如果标题内部开头有空格，会保留)
        // 可以使用 trim() 去掉标题前后可能的多余空格
        return {
            type: match[1],
            title: match[2].trim() // 使用 trim() 清理标题前后空格
        };
    } else {
        console.error("无法解析 Callout 字符串:", JSON.stringify(calloutString)); // 使用 JSON.stringify 更清晰地显示包含换行符的字符串
        return {
            type: "unknown",
            title: "parse error"
        }
    }
}

export const ObsidianCallout = forwardRef<HTMLDivElement, HTMLAttributes<HTMLQuoteElement>>(
    ({ children, ...props }, ref) => {
        const childArray = Array.isArray(children) ? children : [children];
        // childArray = childArray
        console.log("childArray", childArray)
        let firstLineText = '';
        // if (typeof childArray[0] === 'string' && childArray[0] !== "\n" && childArray[0]) {
        //     firstLineText = childArray[0];
        //     console.log("FirstLine!! " + firstLineText, JSON.stringify(childArray))
        // } else if (isValidElement(childArray[0]) && typeof childArray[0].props.children === 'string') {

        firstLineText = childArray.find(item => item !== '\n')?.props.children;

        // }

        debugger

      
        const { type: typeRaw, title } = parseObsidianCallout(firstLineText)

        let content;
        let formattedContent;

        try {

            

            content = firstLineText.toString().replace(/^\[!(\w+)]\s*(.*)/, '').trim();

            console.log("FirstLine!! ---" + content)
            formattedContent = content.split('\n').map((line, index) => (
                <span key={index}>{line}<br /></span>  // 每一行加上 <br />
            ));

        } catch (error) {
            console.error(error)
        }


        const typeMap: Record<string, CalloutType> = {
            info: 'info',
            note: 'info',
            warn: 'warn',
            warning: 'warn',
            error: 'error',
            danger: 'error',
            check: 'success',
            hint: 'hint',
        };

        const mappedType = typeMap[typeRaw] ?? 'default';

        return (
            // @ts-ignore
            <Callout ref={ref} title={title} type={mappedType} {...props}  >

                {formattedContent}
            </Callout>
        );
    },
);

ObsidianCallout.displayName = 'ObsidianCallout';