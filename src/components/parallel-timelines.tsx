"use client"

import { useState, useRef, useEffect } from "react"
import { Globe, Users, User, Info, Star } from "lucide-react" // Import Star

import { cn } from "@/lib/utils" // Assume exists
import { Button } from "@/components/ui/button" // Assume exists
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Assume exists
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Assume exists

// --- Interfaces and Data ---
interface TimelineEvent {
    id: string
    title: string
    description: string
    impact: number // 1-5
    type: "point" | "range"
    startDate: string // YYYY-MM-DD
    endDate?: string // YYYY-MM-DD
    category: "world" | "local" | "personal"
}

// 示例数据 (日期格式已更新为 YYYY-MM-DD)
const eventsData: TimelineEvent[] = [
    // Add more diverse data if needed for testing styles/overlap
    { id: "w6", title: "中美关税战升级", description: "...", impact: 3, type: "range", startDate: "2025-04-02", endDate: "2025-04-21", category: "world" },
    { id: "l6", title: "2025汪苏泷演唱会", description: "汪苏泷来办公室附近开演唱会", impact: 3, type: "range", startDate: "2025-04-11",endDate: "2025-04-13", category: "local" },
    { id: "p5", title: "演唱会场馆门口摆摊", description: "汪苏泷演唱会摆摊", impact: 4, type: "point", startDate: "2025-04-11", category: "personal" },
    { id: "p51", title: "看演唱会", description: "汪苏泷演唱会摆摊", impact: 4, type: "point", startDate: "2025-04-11", category: "personal" },
    { id: "p6", title: "买入黄金", description: "不确定风险增强，个人判断黄金会上涨，购入5克。", impact: 3, type: "point", startDate: "2025-04-08", category: "personal" },

    { id: "p3", title: "学网球", description: "夜校上课6节 + 1V2", impact: 1, type: "range", startDate: "2025-02-20", endDate: "2025-04-21", category: "personal" },
   
    { id: "l7", title: "合肥山姆开业", description: "一家新的咖啡店在公司楼下开业，有优惠活动", impact: 2, type: "point", startDate: "2025-04-15", category: "local" },
    { id: "w7", title: "全球气候峰会", description: "重要国际会议，讨论气候变化应对措施。", impact: 4, type: "point", startDate: "2025-02-20", category: "world" },
];


// --- Colors & Icons ---
const categoryColors = {
    world: { main: "#3b82f6", light: "#93c5fd", dark: "#1d4ed8", bg: "#eff6ff" },
    local: { main: "#10b981", light: "#6ee7b7", dark: "#047857", bg: "#ecfdf5" },
    personal: { main: "#8b5cf6", light: "#c4b5fd", dark: "#6d28d9", bg: "#f5f3ff" },
}

// --- Date Handling ---
function parseDate(dateStr: string): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(Date.UTC(year, month - 1, day)); // Use UTC to avoid timezone issues
    } else if (/^\d{4}-\d{2}$/.test(dateStr)) {
        console.warn(`日期格式 "${dateStr}" 应为 YYYY-MM-DD，已自动视为该月第一天。`);
        const [year, month] = dateStr.split("-").map(Number);
        return new Date(Date.UTC(year, month - 1, 1));
    } else {
        console.error(`无效的日期格式: "${dateStr}"。请使用 YYYY-MM-DD。`);
        return new Date("Invalid Date");
    }
}

function formatDate(dateStr: string, format: 'full' | 'short' = 'full'): string {
    try {
        const date = parseDate(dateStr);
        if (isNaN(date.getTime())) return "无效日期";
        // Adjust for UTC date object formatting if needed, otherwise use local time representation
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");

        if (format === 'short') {
             // Consider showing year if date range spans years? For now, just M-D
            return `${month}-${day}`;
        }
        return `${year}年${month}月${day}日`;
    } catch (e) {
        console.error(`格式化日期时出错: ${dateStr}`, e);
        return dateStr;
    }
}

function getDateRange(events: TimelineEvent[]): { min: Date; max: Date } {
    const dates: Date[] = [];
    events.forEach((event) => {
        const startDate = parseDate(event.startDate);
        if (!isNaN(startDate.getTime())) dates.push(startDate);
        if (event.endDate) {
            const endDate = parseDate(event.endDate);
            if (!isNaN(endDate.getTime())) dates.push(endDate);
        }
    });
    if (dates.length === 0) {
        const now = new Date();
        // Return a default range like the current month in UTC
        return {
            min: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
            max: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
        };
    }
    return {
        min: new Date(Math.min(...dates.map((d) => d.getTime()))),
        max: new Date(Math.max(...dates.map((d) => d.getTime()))),
    };
}

// UPDATED: Calculate Position (Inverted Y + Padding)
function dateToPosition(
    date: Date,
    minDate: Date,
    maxDate: Date,
    svgHeight: number,
    paddingTop: number = 0,
    paddingBottom: number = 0
): number {
    const minTime = minDate.getTime();
    const maxTime = maxDate.getTime();
    const totalMs = maxTime - minTime;
    const dateMs = date.getTime() - minTime;

    const effectiveHeight = svgHeight - paddingTop - paddingBottom;

    if (totalMs <= 0 || effectiveHeight <= 0) {
        return paddingTop + effectiveHeight / 2;
    }

    const proportion = 1 - (dateMs / totalMs); // Inverted
    const position = paddingTop + proportion * effectiveHeight;

    return Math.max(paddingTop, Math.min(position, svgHeight - paddingBottom));
}

// UPDATED: Generate Time Markers (Labels below line)
function generateTimeMarkers(minDate: Date, maxDate: Date): { date: Date; label: string }[] {
    const markers: { date: Date; label: string }[] = [];
    // Start from the first day of the month of minDate in UTC
    const currentDate = new Date(Date.UTC(minDate.getUTCFullYear(), minDate.getUTCMonth(), 1));
     // End condition: the first day of the month *after* maxDate in UTC
    const lastMarkerMonth = new Date(Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth() + 1, 1));


    while (currentDate < lastMarkerMonth) {
        markers.push({
            date: new Date(currentDate), // Create a copy
            label: `${currentDate.getUTCFullYear()}年${currentDate.getUTCMonth() + 1}月`,
        });
        // Move to the first day of the next month in UTC
         currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
    }
    return markers;
}

// UPDATED: Impact Stars Component
function ImpactStars({ level, color }: { level: number; color: string }) {
    return (
        <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        "w-3 h-3",
                        i < level ? `fill-current` : "fill-gray-200 text-gray-300" // Use gray for unfilled
                    )}
                    style={{ color: i < level ? color : undefined }}
                />
            ))}
            {/* Optional: Show numeric rating */}
            {/* <span className="text-xs ml-1 text-gray-500">({level}/5)</span> */}
        </div>
    );
}

// --- Main Component ---
export function ParallelTimelines() {
    const [view, setView] = useState<"desktop" | "mobile">("desktop");
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
    const [dimensions, setDimensions] = useState({ width: 1000, height: 1000 }); // Start with default
    const containerRef = useRef<HTMLDivElement>(null);

    const paddingTop = 60;
    const paddingBottom = 30;

    // useEffect for Dimensions
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                let height = 600; // Min height
                if (eventsData.length > 0) {
                    try {
                        const dateRange = getDateRange(eventsData);
                        if (!isNaN(dateRange.min.getTime()) && !isNaN(dateRange.max.getTime())) {
                            const monthsDiff = (dateRange.max.getUTCFullYear() - dateRange.min.getUTCFullYear()) * 12 + dateRange.max.getUTCMonth() - dateRange.min.getUTCMonth();
                            const validMonthsDiff = Math.max(1, monthsDiff);
                            const monthHeight = 100;
                            height = Math.max(600, validMonthsDiff * monthHeight) + paddingTop + paddingBottom;
                        }
                    } catch (e) { console.error("Error calculating height:", e); }
                }
                setDimensions({ width: Math.max(300, width), height });
            }
        };

        let resizeTimeout: NodeJS.Timeout;
        const debouncedUpdateDimensions = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateDimensions, 150);
        };
        if (typeof window !== 'undefined') {
            updateDimensions(); // Initial call
            window.addEventListener("resize", debouncedUpdateDimensions);
            return () => {
                clearTimeout(resizeTimeout);
                window.removeEventListener("resize", debouncedUpdateDimensions);
            }
        }
    }, []);


    // Date Range & Markers
    let dateRange: { min: Date; max: Date };
    try {
        dateRange = getDateRange(eventsData);
        if (isNaN(dateRange.min.getTime()) || isNaN(dateRange.max.getTime())) throw new Error("Invalid date range");
    } catch (e) {
        const now = new Date();
        dateRange = { min: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), max: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)) };
        console.error("Failed to get date range, using default:", e)
    }
    const timeMarkers = generateTimeMarkers(dateRange.min, dateRange.max);

    // Event Grouping
    const eventsByCategory = {
        world: eventsData.filter((e) => e.category === "world"),
        local: eventsData.filter((e) => e.category === "local"),
        personal: eventsData.filter((e) => e.category === "personal"),
    };

    // Horizontal Position Calculation
    const calculateXPosition = (event: TimelineEvent, category: "world" | "local" | "personal", width: number): number => {
        const laneWidth = width / 3;
        const laneCenter = { world: laneWidth / 2, local: laneWidth * 1.5, personal: laneWidth * 2.5 };
        const maxOffset = laneWidth * 0.35;
        const offsetFactor = (event.impact - 1) / 4;
        let direction = 0;
        if (category === "world") direction = 1;
        else if (category === "personal") direction = -1;
        else direction = event.impact > 3 ? 1 : -1;
        return laneCenter[category] + direction * offsetFactor * maxOffset;
    };

    // --- SVG Timeline Rendering (with Vertical Collision Avoidance) ---
    const renderSvgTimeline = () => {
        const { width, height } = dimensions;
        if (width <= 0 || height <= 0 || isNaN(height)) return <div className="p-4 text-center text-gray-400">Calculating layout...</div>; // Handle invalid dimensions

        const laneWidth = width / 3;
        const laneCenters = { world: laneWidth / 2, local: laneWidth * 1.5, personal: laneWidth * 2.5 };

        // Vertical Timeline Lines
        const timelineLines = (
            <g className="timeline-lines">
                {Object.entries(laneCenters).map(([category, x]) => (
                    <line key={`line-${category}`} x1={x} y1={paddingTop} x2={x} y2={height - paddingBottom} stroke={categoryColors[category as keyof typeof categoryColors].main} strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 5"/>
                ))}
            </g>
        );

        // Horizontal Time Markers
        const timeMarkerElements = (
            <g className="time-markers">
                {timeMarkers.map((marker) => {
                    const y = dateToPosition(marker.date, dateRange.min, dateRange.max, height, paddingTop, paddingBottom);
                    if (y <= paddingTop || y >= height - paddingBottom) return null; // Avoid drawing exactly on padding lines
                    return (
                        <g key={`marker-${marker.label}`}>
                            <line x1={0} y1={y} x2={width} y2={y} stroke="#e5e7eb" strokeWidth={1} strokeOpacity={0.5} strokeDasharray="2 4" />
                            <text x={10} y={y + 14} fontSize="11" fill="#a0aec0" dominantBaseline="middle" textAnchor="start">{marker.label}</text>
                        </g>
                    );
                })}
            </g>
        );

        // Render Events (with Collision Logic)
        const renderEvents = (category: "world" | "local" | "personal") => {
             // Sort events by date (newest first for top-down rendering)
            const sortedCategoryEvents = [...eventsByCategory[category]].sort(
                (a, b) => parseDate(b.startDate).getTime() - parseDate(a.startDate).getTime()
            );

            let lastLabelBottomY: number | null = null;
            const labelVerticalPadding = 4; // Pixels between labels vertically

            return sortedCategoryEvents.map((event) => {
                const x = calculateXPosition(event, category, width);
                let startY: number, endY: number | undefined;

                try {
                    startY = dateToPosition(parseDate(event.startDate), dateRange.min, dateRange.max, height, paddingTop, paddingBottom);
                    if (event.endDate) endY = dateToPosition(parseDate(event.endDate), dateRange.min, dateRange.max, height, paddingTop, paddingBottom);
                    if (isNaN(startY) || (endY !== undefined && isNaN(endY))) throw new Error("Invalid date position");
                } catch (e) { 

                    console.error(e);
                    return null; 
                
                } // Skip problematic events

                const color = categoryColors[category];
                const labelOffsetX = category === "personal" ? -165 : 25;
                const labelWidth = 140;
                const labelHeight = 36; // Keep consistent height

                // --- Collision Avoidance ---
                 // Determine base Y for the label before collision check
                 let labelBaseY = startY - labelHeight / 2; // Default: center around startY for point
                 if (event.type === 'range' && endY !== undefined) {
                    labelBaseY = Math.min(startY, endY) + Math.abs(startY - endY) / 2 - labelHeight / 2; // Default: center in range
                 }

                 const currentLabelTopY = labelBaseY;
                 if (lastLabelBottomY !== null && currentLabelTopY < lastLabelBottomY + labelVerticalPadding) {
                     labelBaseY = lastLabelBottomY + labelVerticalPadding; // Adjust Y downwards
                 }
                 // Update tracker for the *next* event
                 lastLabelBottomY = labelBaseY + labelHeight;
                 // --- End Collision Avoidance ---


                const tooltipContent = (
                    <div className="p-1 space-y-1 max-w-xs text-xs">
                        <h4 className="font-semibold text-sm" style={{ color: color.dark }}>{event.title}</h4>
                        <p className="text-gray-500">{event.type === 'range' && event.endDate ? `${formatDate(event.startDate)} - ${formatDate(event.endDate)}` : formatDate(event.startDate)}</p>
                        <ImpactStars level={event.impact} color={color.main} />
                        <p className="text-gray-700 pt-1">{event.description}</p>
                    </div>
                );

                 // Point Event
                if (event.type === "point") {
                    return (
                        <g key={`${category}-${event.id}`} className="event-point group">
                            <line x1={laneCenters[category]} y1={startY} x2={x} y2={startY} stroke={color.light} strokeWidth={1.5} />
                            <circle cx={x} cy={startY} r={4 + event.impact * 0.5} fill={color.main} className="cursor-pointer transition-all group-hover:r-[8] group-hover:opacity-80" onClick={() => setSelectedEvent(event)}/>
                            <foreignObject x={x + labelOffsetX} y={labelBaseY} width={labelWidth} height={labelHeight}>
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="px-2 py-0.5 rounded text-xs font-medium cursor-pointer space-y-0.5 h-full flex flex-col justify-center" style={{ backgroundColor: color.bg, color: color.dark, textAlign: category === "personal" ? "right" : "left" }} onClick={() => setSelectedEvent(event)}>
                                                <div className="truncate font-semibold">{event.title}</div>
                                                <div className="truncate text-[10px] opacity-70">{formatDate(event.startDate, 'short')}</div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side={category === "personal" ? "left" : "right"}>{tooltipContent}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </foreignObject>
                        </g>
                    );
                }
                // Range Event
                else if (endY !== undefined) {
                    const rangeRectY = Math.min(startY, endY);
                    const rangeRectHeight = Math.abs(startY - endY);
                    if (rangeRectHeight < 2) return null;
                    return (
                        <g key={`${category}-${event.id}`} className="event-range group">
                            <rect x={x - 4} y={rangeRectY} width={8} height={rangeRectHeight} fill={color.main} fillOpacity={0.7} rx={4} ry={4} className="cursor-pointer transition-all group-hover:fill-opacity-90" onClick={() => setSelectedEvent(event)}/>
                            <line x1={laneCenters[category]} y1={startY} x2={x} y2={startY} stroke={color.light} strokeWidth={1.5} />
                            <line x1={laneCenters[category]} y1={endY} x2={x} y2={endY} stroke={color.light} strokeWidth={1.5} />
                            <circle cx={x} cy={startY} r={3} fill="white" stroke={color.main} strokeWidth={1.5} />
                            <circle cx={x} cy={endY} r={3} fill="white" stroke={color.main} strokeWidth={1.5} />
                            <foreignObject x={x + labelOffsetX} y={labelBaseY} width={labelWidth} height={labelHeight}>
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="px-2 py-0.5 rounded text-xs font-medium cursor-pointer space-y-0.5 h-full flex flex-col justify-center" style={{ backgroundColor: color.bg, color: color.dark, textAlign: category === "personal" ? "right" : "left" }} onClick={() => setSelectedEvent(event)}>
                                                <div className="truncate font-semibold">{event.title}</div>
                                                <div className="truncate text-[10px] opacity-70">{formatDate(event.startDate, 'short')} - {formatDate(event.endDate!, 'short')}</div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side={category === "personal" ? "left" : "right"}>{tooltipContent}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </foreignObject>
                        </g>
                    );
                }
                return null;
            });
        };

        // Category Titles
        const categoryTitles = (
            <g className="category-titles" style={{ pointerEvents: 'none' }}>
                 {Object.entries(laneCenters).map(([category, x]) => (
                    <foreignObject key={`title-${category}`} x={x - 75} y={paddingTop / 2 - 15} width={150} height={30}>
                         <div className="flex items-center justify-center gap-1.5">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors].bg, color: categoryColors[category as keyof typeof categoryColors].dark }}>
                                {category === 'world' ? <Globe className="h-3.5 w-3.5" /> : category === 'local' ? <Users className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                            </div>
                            <span className="font-semibold text-sm" style={{ color: categoryColors[category as keyof typeof categoryColors].dark }}>
                                {category === "world" ? "世界大事" : category === "local" ? "身边的事" : "自己的事"}
                            </span>
                        </div>
                    </foreignObject>
                ))}
            </g>
        );

        // Final SVG Structure
        return (
            <svg width={width} height={height} className="border rounded-lg bg-gradient-to-b from-white to-gray-50 min-w-[600px]">
                {timeMarkerElements}
                {timelineLines}
                {renderEvents("world")}
                {renderEvents("local")}
                {renderEvents("personal")}
                {categoryTitles}
            </svg>
        );
    };

    // --- Mobile View Rendering ---
    const renderMobileView = () => {
        return (
             <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid grid-cols-4 gap-1 mb-4 bg-gray-100 p-1 rounded-lg sticky top-0 z-10">
                    <TabsTrigger value="all" className="text-xs px-2 py-1 data-[state=active]:bg-white data-[state=active]:shadow rounded">全部</TabsTrigger>
                    <TabsTrigger value="world" className="text-xs px-2 py-1 data-[state=active]:bg-white data-[state=active]:shadow rounded">世界</TabsTrigger>
                    <TabsTrigger value="local" className="text-xs px-2 py-1 data-[state=active]:bg-white data-[state=active]:shadow rounded">身边</TabsTrigger>
                    <TabsTrigger value="personal" className="text-xs px-2 py-1 data-[state=active]:bg-white data-[state=active]:shadow rounded">自己</TabsTrigger>
                </TabsList>

                <TabsContent value="all"><MobileTimeline events={eventsData} dateRange={dateRange} onSelectEvent={setSelectedEvent} /></TabsContent>
                <TabsContent value="world"><MobileTimeline events={eventsByCategory.world} dateRange={dateRange} onSelectEvent={setSelectedEvent} /></TabsContent>
                <TabsContent value="local"><MobileTimeline events={eventsByCategory.local} dateRange={dateRange} onSelectEvent={setSelectedEvent} /></TabsContent>
                <TabsContent value="personal"><MobileTimeline events={eventsByCategory.personal} dateRange={dateRange} onSelectEvent={setSelectedEvent} /></TabsContent>
            </Tabs>
        );
    };

    // --- Event Details Modal ---
    const renderEventDetails = () => {
        if (!selectedEvent) return null;
        const category = selectedEvent.category;
        const color = categoryColors[category];
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in-50 zoom-in-90 duration-300" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 flex justify-between items-start" style={{ backgroundColor: color.bg }}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: color.main, color: 'white' }}> {category === 'world' ? <Globe className="h-4 w-4" /> : category === 'local' ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}</div>
                            <div>
                                <h3 className="text-lg font-semibold" style={{ color: color.dark }}>{selectedEvent.title}</h3>
                                <span className="text-xs font-medium text-gray-500">{category === "world" ? "世界大事" : category === "local" ? "身边的事" : "自己的事"}</span>
                            </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600" onClick={() => setSelectedEvent(null)}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="text-sm text-gray-600">{selectedEvent.type === "point" ? <span>日期：{formatDate(selectedEvent.startDate)}</span> : <span>时间段：{formatDate(selectedEvent.startDate)} - {selectedEvent.endDate ? formatDate(selectedEvent.endDate) : '至今'}</span>}</div>
                        <ImpactStars level={selectedEvent.impact} color={color.main} />
                        <p className="text-gray-800 text-sm leading-relaxed bg-gray-50 p-3 rounded-md border border-gray-200">{selectedEvent.description}</p>
                    </div>
                    <div className="px-5 py-3 bg-gray-50 flex justify-end border-t border-gray-100"><Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)}>关闭</Button></div>
                </div>
            </div>
        );
    };

    // --- Main Component Layout ---
    return (
        <div className="p-2 sm:p-4 space-y-4 bg-gray-100 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                 <div className="flex items-center gap-3 flex-wrap">
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild><Button variant="outline" size="icon" className="w-8 h-8"><Info className="h-4 w-4" /></Button></TooltipTrigger>
                            <TooltipContent><p className="max-w-xs text-xs">时间轴从上到下由新到旧。水平偏移表示影响程度。</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <div className="text-xs font-medium text-gray-600 hidden md:block">影响强度:</div>
                     <div className="flex items-center gap-1" title="Impact Level 1 to 5">
                        {Array.from({length: 5}).map((_, i) => <div key={i} className={`w-2 h-2 rounded-full`} style={{backgroundColor: `hsl(210, 10%, ${70 - i*10}%)`}}/>)}
                         <span className="text-xs text-muted-foreground ml-1">弱 → 强</span>
                    </div>
                </div>
                 <div className="flex gap-2 self-end sm:self-center">
                    <Button variant={view === "desktop" ? "secondary" : "outline"} size="sm" onClick={() => setView("desktop")}>并列视图</Button>
                    <Button variant={view === "mobile" ? "secondary" : "outline"} size="sm" onClick={() => setView("mobile")}>合并视图</Button>
                </div>
            </div>

            <div ref={containerRef} className="relative overflow-auto bg-white rounded-lg shadow border border-gray-200" style={{ height: dimensions.height }}>
                 { eventsData.length === 0 ? ( <div className="flex items-center justify-center h-40 text-gray-400">无事件数据</div>
                ) : dimensions.width > 0 && dimensions.height > 0 && !isNaN(dimensions.height)? (
                    view === "desktop" ? renderSvgTimeline() : <div className="p-2">{renderMobileView()}</div> // Add padding around mobile view
                ) : ( <div className="flex items-center justify-center h-40 text-gray-400 animate-pulse">加载中...</div> )}
            </div>

            {selectedEvent && renderEventDetails()}
        </div>
    );
}


// --- MobileTimeline Component (with basic Collision Avoidance) ---
interface MobileTimelineProps {
    events: TimelineEvent[]
    dateRange: { min: Date; max: Date }
    onSelectEvent: (event: TimelineEvent) => void
}

function MobileTimeline({ events, dateRange, onSelectEvent }: MobileTimelineProps) {
    const paddingTopMobile = 30;
    const paddingBottomMobile = 20;

    const calculateHeight = () => {
        if (isNaN(dateRange.min.getTime()) || isNaN(dateRange.max.getTime())) return 500;
        const monthsDiff = (dateRange.max.getUTCFullYear() - dateRange.min.getUTCFullYear()) * 12 + dateRange.max.getUTCMonth() - dateRange.min.getUTCMonth();
        const validMonthsDiff = Math.max(1, monthsDiff);
        const monthHeight = 80;
        return Math.max(400, validMonthsDiff * monthHeight) + paddingTopMobile + paddingBottomMobile;
    };

    const height = calculateHeight();
    const width = 320; // Mobile width

    if (events.length === 0) return <div className="text-center text-gray-400 py-10 text-sm">此分类下无事件</div>;
    if (width <= 0 || height <= 0 || isNaN(height)) return <div className="text-center text-gray-400 py-10 text-sm">加载中...</div>;

    // Sort for rendering order (newest first)
    const sortedEvents = [...events].sort((a, b) => parseDate(b.startDate).getTime() - parseDate(a.startDate).getTime());
    const mobileTimeMarkers = generateTimeMarkers(dateRange.min, dateRange.max);

    // --- Collision Tracking for Mobile ---
    // We need separate trackers for left and right sides
    let lastLabelBottomY_Left: number | null = null;
    let lastLabelBottomY_Right: number | null = null;
    const labelVerticalPaddingMobile = 3;
    // ---

    return (
        <div className="relative w-full flex justify-center py-4 overflow-hidden">
            <svg width={width} height={height} className="bg-white rounded-lg">
                <line x1={width / 2} y1={paddingTopMobile} x2={width / 2} y2={height - paddingBottomMobile} stroke="#e5e7eb" strokeWidth={1.5} />

                 {mobileTimeMarkers.map((marker) => {
                    const y = dateToPosition(marker.date, dateRange.min, dateRange.max, height, paddingTopMobile, paddingBottomMobile);
                     if (y <= paddingTopMobile + 5 || y >= height - paddingBottomMobile - 5) return null; // Extra check for bounds
                    return (
                        <g key={`m-marker-${marker.label}`}>
                            <line x1={width / 2 - 4} y1={y} x2={width / 2 + 4} y2={y} stroke="#d1d5db" strokeWidth={1} />
                            <text x={8} y={y + 3} fontSize="10" fill="#a0aec0" dominantBaseline="middle">{marker.label}</text>
                        </g>
                    );
                })}

                 {sortedEvents.map((event, index) => {
                    const category = event.category;
                    const color = categoryColors[category];
                    const centerX = width / 2;
                    let startY: number, endY: number | undefined;

                     try { // Error handling for date position
                        startY = dateToPosition(parseDate(event.startDate), dateRange.min, dateRange.max, height, paddingTopMobile, paddingBottomMobile);
                        if (event.endDate) endY = dateToPosition(parseDate(event.endDate), dateRange.min, dateRange.max, height, paddingTopMobile, paddingBottomMobile);
                        if (isNaN(startY) || (endY !== undefined && isNaN(endY))) return null; // Skip if position invalid
                    } catch (e) {
                        
                        console.error(e);
                        return null; 
                    
                    }

                    const direction = index % 2 === 0 ? 1 : -1; // Alternate sides
                    const baseOffset = width * 0.18;
                    const impactOffset = ((event.impact - 1) / 4) * (width * 0.15);
                    const x = centerX + direction * (baseOffset + impactOffset);

                    const labelOffsetX = direction < 0 ? -125 : 15;
                    const labelWidth = 110;
                    const labelHeight = 32; // Mobile label height

                     // --- Mobile Collision Avoidance ---
                    let labelBaseY = startY - labelHeight / 2; // Default Y
                    if (event.type === 'range' && endY !== undefined) {
                        labelBaseY = Math.min(startY, endY) + Math.abs(startY - endY) / 2 - labelHeight / 2;
                    }

                    const currentLabelTopY = labelBaseY;
                    if (direction === -1) { // Left side
                        if (lastLabelBottomY_Left !== null && currentLabelTopY < lastLabelBottomY_Left + labelVerticalPaddingMobile) {
                            labelBaseY = lastLabelBottomY_Left + labelVerticalPaddingMobile;
                        }
                        lastLabelBottomY_Left = labelBaseY + labelHeight;
                    } else { // Right side
                         if (lastLabelBottomY_Right !== null && currentLabelTopY < lastLabelBottomY_Right + labelVerticalPaddingMobile) {
                            labelBaseY = lastLabelBottomY_Right + labelVerticalPaddingMobile;
                        }
                        lastLabelBottomY_Right = labelBaseY + labelHeight;
                    }
                    // --- End Mobile Collision ---

                    const tooltipContent = ( /* ... same tooltip content ... */
                        <div className="p-1 space-y-1 max-w-[180px] text-xs">
                            <h4 className="font-semibold text-sm" style={{ color: color.dark }}>{event.title}</h4>
                            <p className="text-gray-500">{event.type === 'range' && event.endDate ? `${formatDate(event.startDate)} - ${formatDate(event.endDate)}` : formatDate(event.startDate)}</p>
                            <ImpactStars level={event.impact} color={color.main} />
                            <p className="text-gray-700 pt-1">{event.description}</p>
                        </div>
                    );

                    if (event.type === "point") {
                        return (
                             <g key={`mobile-${event.id}`} className="event-point group">
                                <line x1={centerX} y1={startY} x2={x} y2={startY} stroke={color.light} strokeWidth={1} />
                                <circle cx={x} cy={startY} r={3 + event.impact * 0.4} fill={color.main} className="cursor-pointer transition-all group-hover:r-[6]" onClick={() => onSelectEvent(event)}/>
                                <foreignObject x={x + labelOffsetX} y={labelBaseY} width={labelWidth} height={labelHeight}>
                                    <TooltipProvider delayDuration={100}> <Tooltip> <TooltipTrigger asChild>
                                        <div className="px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer space-y-0.5 h-full flex flex-col justify-center" style={{ backgroundColor: color.bg, color: color.dark, textAlign: direction < 0 ? "right" : "left" }} onClick={() => onSelectEvent(event)}>
                                            <div className="truncate font-semibold">{event.title}</div>
                                            <div className="truncate text-[9px] opacity-70">{formatDate(event.startDate, 'short')}</div>
                                        </div>
                                    </TooltipTrigger><TooltipContent side={direction < 0 ? "left" : "right"}>{tooltipContent}</TooltipContent></Tooltip></TooltipProvider>
                                </foreignObject>
                            </g>
                         );
                     } else if (endY !== undefined) {
                         const rangeRectY = Math.min(startY, endY); const rangeRectHeight = Math.abs(startY - endY); if (rangeRectHeight < 2) return null;
                         return (
                             <g key={`mobile-${event.id}`} className="event-range group">
                                 <rect x={x - 3} y={rangeRectY} width={6} height={rangeRectHeight} fill={color.main} fillOpacity={0.6} rx={3} ry={3} className="cursor-pointer transition-all group-hover:fill-opacity-80" onClick={() => onSelectEvent(event)}/>
                                <line x1={centerX} y1={startY} x2={x} y2={startY} stroke={color.light} strokeWidth={1} /> <line x1={centerX} y1={endY} x2={x} y2={endY} stroke={color.light} strokeWidth={1} />
                                <circle cx={x} cy={startY} r={2.5} fill="white" stroke={color.main} strokeWidth={1} /> <circle cx={x} cy={endY} r={2.5} fill="white" stroke={color.main} strokeWidth={1} />
                                <foreignObject x={x + labelOffsetX} y={labelBaseY} width={labelWidth} height={labelHeight}>
                                    <TooltipProvider delayDuration={100}> <Tooltip> <TooltipTrigger asChild>
                                        <div className="px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer space-y-0.5 h-full flex flex-col justify-center" style={{ backgroundColor: color.bg, color: color.dark, textAlign: direction < 0 ? "right" : "left" }} onClick={() => onSelectEvent(event)}>
                                            <div className="truncate font-semibold">{event.title}</div>
                                            <div className="truncate text-[9px] opacity-70">{formatDate(event.startDate, 'short')} - {formatDate(event.endDate!, 'short')}</div>
                                        </div>
                                    </TooltipTrigger><TooltipContent side={direction < 0 ? "left" : "right"}>{tooltipContent}</TooltipContent></Tooltip></TooltipProvider>
                                </foreignObject>
                            </g>
                         );
                     }
                    return null;
                })}
            </svg>
        </div>
    );
}