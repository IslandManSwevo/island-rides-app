declare var __DEV__: boolean;

declare module 'react-native' {
  export * from 'react-native/types';
}

declare module '@react-navigation/stack' {
  export * from '@react-navigation/stack/lib/typescript/src';
}

declare module '@react-navigation/native' {
  export * from '@react-navigation/native/lib/typescript/src';
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: any;
  export default AsyncStorage;
}

declare module 'react-native-reanimated' {
  export * from 'react-native-reanimated/lib/typescript';
  import { ComponentType } from 'react';
  import { ViewProps, TextProps } from 'react-native';
  
  export namespace Animated {
    export const View: ComponentType<ViewProps & any>;
    export const Text: ComponentType<TextProps & any>;
    export const ScrollView: ComponentType<any>;
    export const Image: ComponentType<any>;
  }
}

declare module 'rxjs' {
  export class BehaviorSubject<T> {
    value: T;
    constructor(value: T);
    next(value: T): void;
    asObservable(): any;
  }
}

// Firebase auth module declaration removed - using actual Firebase SDK types

declare module 'react-native-maps' {
  export * from 'react-native-maps/lib/typescript';
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';
  
  export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }
  
  export interface LatLng {
    latitude: number;
    longitude: number;
  }
  
  export interface MapViewProps extends ViewProps {
    region?: Region;
    initialRegion?: Region;
    onRegionChange?: (region: Region) => void;
    onRegionChangeComplete?: (region: Region) => void;
    showsUserLocation?: boolean;
    followsUserLocation?: boolean;
    showsMyLocationButton?: boolean;
    showsPointsOfInterest?: boolean;
    showsCompass?: boolean;
    showsScale?: boolean;
    showsBuildings?: boolean;
    showsTraffic?: boolean;
    showsIndoors?: boolean;
    showsIndoorLevelPicker?: boolean;
    zoomEnabled?: boolean;
    zoomControlEnabled?: boolean;
    rotateEnabled?: boolean;
    scrollEnabled?: boolean;
    pitchEnabled?: boolean;
    toolbarEnabled?: boolean;
    cacheEnabled?: boolean;
    loadingEnabled?: boolean;
    loadingBackgroundColor?: string;
    loadingIndicatorColor?: string;
    moveOnMarkerPress?: boolean;
    liteMode?: boolean;
    mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain' | 'none' | 'mutedStandard';
    customMapStyle?: any[];
    userLocationAnnotationTitle?: string;
    provider?: 'google' | 'apple';
    children?: React.ReactNode;
  }
  
  export interface MarkerProps extends ViewProps {
    coordinate: LatLng;
    title?: string;
    description?: string;
    image?: any;
    pinColor?: string;
    anchor?: { x: number; y: number };
    calloutAnchor?: { x: number; y: number };
    flat?: boolean;
    identifier?: string;
    rotation?: number;
    draggable?: boolean;
    onPress?: () => void;
    onSelect?: () => void;
    onDeselect?: () => void;
    onCalloutPress?: () => void;
    onDragStart?: () => void;
    onDrag?: () => void;
    onDragEnd?: () => void;
    zIndex?: number;
    opacity?: number;
    children?: React.ReactNode;
  }
  
  export interface CalloutProps extends ViewProps {
    tooltip?: boolean;
    onPress?: () => void;
    alphaHitTest?: boolean;
    children?: React.ReactNode;
  }
  
  const MapView: ComponentType<MapViewProps>;
  export default MapView;
  export const Marker: ComponentType<MarkerProps>;
  export const Callout: ComponentType<CalloutProps>;
}

declare module 'react-native-gifted-chat' {
  export * from 'react-native-gifted-chat/lib/typescript';
  import { ComponentType } from 'react';
  import { ViewProps, TextProps, TextInputProps } from 'react-native';
  
  export interface IMessage {
    _id: string | number;
    text: string;
    createdAt: Date | number;
    user: User;
    image?: string;
    video?: string;
    audio?: string;
    system?: boolean;
    sent?: boolean;
    received?: boolean;
    pending?: boolean;
    quickReplies?: QuickReplies;
  }
  
  export interface User {
    _id: string | number;
    name?: string;
    avatar?: string | (() => React.ReactElement) | React.ReactElement;
  }
  
  export interface QuickReplies {
    type: 'radio' | 'checkbox';
    values: QuickReply[];
    keepIt?: boolean;
  }
  
  export interface QuickReply {
    title: string;
    value: string;
    messageId?: string | number;
  }
  
  export interface GiftedChatProps {
    messages: IMessage[];
    onSend: (messages: IMessage[]) => void;
    user: User;
    renderBubble?: (props: BubbleProps<IMessage>) => React.ReactElement | null;
    renderActions?: (props: ActionsProps) => React.ReactElement | null;
    renderSend?: (props: SendProps<IMessage>) => React.ReactElement | null;
    renderInputToolbar?: (props: InputToolbarProps<IMessage>) => React.ReactElement | null;
    renderMessageImage?: (props: MessageImageProps<IMessage>) => React.ReactElement | null;
    renderMessageAudio?: (props: any) => React.ReactElement | null;
    placeholder?: string;
    showUserAvatar?: boolean;
    showAvatarForEveryMessage?: boolean;
    onPressAvatar?: (user: User) => void;
    renderAvatar?: (props: any) => React.ReactElement | null;
    onLongPress?: (context: any, message: IMessage) => void;
    inverted?: boolean;
    renderFooter?: () => React.ReactElement | null;
    renderHeader?: () => React.ReactElement | null;
    minInputToolbarHeight?: number;
    listViewProps?: any;
    textInputProps?: TextInputProps;
    keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
    onInputTextChanged?: (text: string) => void;
    maxInputLength?: number;
    parsePatterns?: (linkStyle: any) => any[];
    extraData?: any;
    scrollToBottom?: boolean;
    scrollToBottomComponent?: () => React.ReactElement;
    alignTop?: boolean;
    onQuickReply?: (replies: QuickReply[]) => void;
    renderQuickReplies?: (quickReplies: QuickReplies) => React.ReactElement | null;
    quickReplyStyle?: any;
    renderQuickReplySend?: () => React.ReactElement | null;
    onPressActionButton?: () => void;
    bottomOffset?: number;
    minComposerHeight?: number;
    maxComposerHeight?: number;
    isAnimated?: boolean;
    loadEarlier?: boolean;
    onLoadEarlier?: () => void;
    isLoadingEarlier?: boolean;
    renderLoadEarlier?: (props: any) => React.ReactElement | null;
    renderChatEmpty?: () => React.ReactElement | null;
    renderChatFooter?: () => React.ReactElement | null;
    renderAccessory?: (props: InputToolbarProps<IMessage>) => React.ReactElement | null;
    renderComposer?: (props: any) => React.ReactElement | null;
    imageStyle?: any;
    lightboxProps?: any;
    isKeyboardInternallyHandled?: boolean;
    infiniteScroll?: boolean;
    isTyping?: boolean;
    alwaysShowSend?: boolean;
    messagesContainerStyle?: any;
    renderUsernameOnMessage?: boolean;
    dateFormat?: string;
  }
  
  export interface BubbleProps<TMessage extends IMessage = IMessage> {
    currentMessage?: TMessage;
    nextMessage?: TMessage;
    previousMessage?: TMessage;
    user?: User;
    touchableProps?: any;
    onLongPress?: (context: any, message: TMessage) => void;
    renderMessageImage?: (props: MessageImageProps<TMessage>) => React.ReactElement | null;
    renderMessageVideo?: (props: any) => React.ReactElement | null;
    renderMessageAudio?: (props: any) => React.ReactElement | null;
    renderMessageText?: (props: any) => React.ReactElement | null;
    renderCustomView?: (props: any) => React.ReactElement | null;
    renderTime?: (props: any) => React.ReactElement | null;
    renderTicks?: (currentMessage: TMessage) => React.ReactElement | null;
    containerStyle?: any;
    wrapperStyle?: any;
    containerToNextStyle?: any;
    containerToPreviousStyle?: any;
    bottomContainerStyle?: any;
    tickStyle?: any;
    usernameStyle?: any;
    containerStyleLeft?: any;
    containerStyleRight?: any;
    position?: 'left' | 'right';
    textStyle?: any;
  }
  
  export interface ActionsProps {
    onSend: (messages: Partial<IMessage> | Partial<IMessage>[]) => void;
    options?: any;
    optionTintColor?: string;
    icon?: () => React.ReactElement;
    wrapperStyle?: any;
    iconTextStyle?: any;
    containerStyle?: any;
    onPressActionButton?: () => void;
  }
  
  export interface SendProps<TMessage extends IMessage = IMessage> {
    text?: string;
    onSend: (messages: Partial<TMessage> | Partial<TMessage>[], shouldResetInputToolbar?: boolean) => void;
    label?: string;
    containerStyle?: any;
    textStyle?: any;
    children?: React.ReactElement;
    alwaysShowSend?: boolean;
    disabled?: boolean;
    sendButtonProps?: any;
  }
  
  export interface InputToolbarProps<TMessage extends IMessage = IMessage> {
    options?: any;
    optionTintColor?: string;
    containerStyle?: any;
    primaryStyle?: any;
    accessoryStyle?: any;
    renderAccessory?: (props: InputToolbarProps<TMessage>) => React.ReactElement | null;
    renderActions?: (props: ActionsProps) => React.ReactElement | null;
    renderSend?: (props: SendProps<TMessage>) => React.ReactElement | null;
    renderComposer?: (props: any) => React.ReactElement | null;
    onPressActionButton?: () => void;
  }
  
  export interface MessageImageProps<TMessage extends IMessage = IMessage> {
    currentMessage?: TMessage;
    containerStyle?: any;
    imageStyle?: any;
    imageProps?: any;
    lightboxProps?: any;
  }
  
  export interface GiftedChatStatic {
    append: (currentMessages: IMessage[], messages: IMessage[], inverted?: boolean) => IMessage[];
  }
  
  export const GiftedChat: ComponentType<GiftedChatProps> & GiftedChatStatic;
  export const Actions: ComponentType<ActionsProps>;
  export const Send: ComponentType<SendProps>;
  export const Bubble: ComponentType<BubbleProps>;
  export const InputToolbar: ComponentType<InputToolbarProps>;
  export const MessageImage: ComponentType<MessageImageProps>;
}

declare module 'expo-*' {
  const module: any;
  export = module;
}

declare module '@react-native-community/*' {
  const module: any;
  export = module;
}

declare module '@testing-library/react-native' {
  import { ReactTestInstance } from 'react-test-renderer';
  
  export interface RenderOptions {
    wrapper?: React.ComponentType<any>;
    createNodeMock?: (element: React.ReactElement) => any;
  }
  
  export interface RenderResult {
    container: ReactTestInstance;
    baseElement: ReactTestInstance;
    debug: (el?: ReactTestInstance) => void;
    rerender: (ui: React.ReactElement) => void;
    unmount: () => void;
    asJSON: () => ReactTestInstance | ReactTestInstance[] | null;
    root: ReactTestInstance;
    UNSAFE_root: ReactTestInstance;
    getByText: (text: string | RegExp) => ReactTestInstance;
    queryByText: (text: string | RegExp) => ReactTestInstance | null;
    getAllByText: (text: string | RegExp) => ReactTestInstance[];
    queryAllByText: (text: string | RegExp) => ReactTestInstance[];
    getByDisplayValue: (value: string | RegExp) => ReactTestInstance;
    queryByDisplayValue: (value: string | RegExp) => ReactTestInstance | null;
    getAllByDisplayValue: (value: string | RegExp) => ReactTestInstance[];
    queryAllByDisplayValue: (value: string | RegExp) => ReactTestInstance[];
    getByTestId: (testId: string) => ReactTestInstance;
    queryByTestId: (testId: string) => ReactTestInstance | null;
    getAllByTestId: (testId: string) => ReactTestInstance[];
    queryAllByTestId: (testId: string) => ReactTestInstance[];
    getByRole: (role: string) => ReactTestInstance;
    queryByRole: (role: string) => ReactTestInstance | null;
    getAllByRole: (role: string) => ReactTestInstance[];
    queryAllByRole: (role: string) => ReactTestInstance[];
    getByLabelText: (text: string | RegExp) => ReactTestInstance;
    queryByLabelText: (text: string | RegExp) => ReactTestInstance | null;
    getAllByLabelText: (text: string | RegExp) => ReactTestInstance[];
    queryAllByLabelText: (text: string | RegExp) => ReactTestInstance[];
    getByPlaceholderText: (text: string | RegExp) => ReactTestInstance;
    queryByPlaceholderText: (text: string | RegExp) => ReactTestInstance | null;
    getAllByPlaceholderText: (text: string | RegExp) => ReactTestInstance[];
    queryAllByPlaceholderText: (text: string | RegExp) => ReactTestInstance[];
  }
  
  export interface FireEventFunction {
    (element: ReactTestInstance, eventName: string, ...data: any[]): void;
    press: (element: ReactTestInstance) => void;
    changeText: (element: ReactTestInstance, text: string) => void;
    scroll: (element: ReactTestInstance, eventData?: any) => void;
  }
  
  export function render(ui: React.ReactElement, options?: RenderOptions): RenderResult;
  export const fireEvent: FireEventFunction;
  export function waitFor<T>(callback: () => T | Promise<T>, options?: { timeout?: number; interval?: number }): Promise<T>;
  export function cleanup(): void;
  export function act(callback: () => void | Promise<void>): Promise<void>;
  
  export const screen: {
    getByText: (text: string | RegExp) => ReactTestInstance;
    queryByText: (text: string | RegExp) => ReactTestInstance | null;
    getAllByText: (text: string | RegExp) => ReactTestInstance[];
    queryAllByText: (text: string | RegExp) => ReactTestInstance[];
    getByDisplayValue: (value: string | RegExp) => ReactTestInstance;
    queryByDisplayValue: (value: string | RegExp) => ReactTestInstance | null;
    getAllByDisplayValue: (value: string | RegExp) => ReactTestInstance[];
    queryAllByDisplayValue: (value: string | RegExp) => ReactTestInstance[];
    getByTestId: (testId: string) => ReactTestInstance;
    queryByTestId: (testId: string) => ReactTestInstance | null;
    getAllByTestId: (testId: string) => ReactTestInstance[];
    queryAllByTestId: (testId: string) => ReactTestInstance[];
    getByRole: (role: string) => ReactTestInstance;
    queryByRole: (role: string) => ReactTestInstance | null;
    getAllByRole: (role: string) => ReactTestInstance[];
    queryAllByRole: (role: string) => ReactTestInstance[];
    getByLabelText: (text: string | RegExp) => ReactTestInstance;
    queryByLabelText: (text: string | RegExp) => ReactTestInstance | null;
    getAllByLabelText: (text: string | RegExp) => ReactTestInstance[];
    queryAllByLabelText: (text: string | RegExp) => ReactTestInstance[];
    getByPlaceholderText: (text: string | RegExp) => ReactTestInstance;
    queryByPlaceholderText: (text: string | RegExp) => ReactTestInstance | null;
    getAllByPlaceholderText: (text: string | RegExp) => ReactTestInstance[];
    queryAllByPlaceholderText: (text: string | RegExp) => ReactTestInstance[];
    debug: (el?: ReactTestInstance) => void;
  };
}

// Jest globals
declare global {
  var describe: any;
  var it: any;
  var expect: any;
  var beforeEach: any;
  var jest: any;
  
  // Timer functions with proper overloads for Promise compatibility
  function setTimeout(handler: TimerHandler, timeout?: number, ...args: any[]): number;
  function clearTimeout(handle?: number): void;
  function setInterval(handler: TimerHandler, timeout?: number, ...args: any[]): number;
  function clearInterval(handle?: number): void;
  
  type TimerHandler = string | Function;

  // Web globals (when running on web platform)
  interface Window {
    location: {
      reload(): void;
      href: string;
    };
  }
  
  var window: Window | undefined;
}