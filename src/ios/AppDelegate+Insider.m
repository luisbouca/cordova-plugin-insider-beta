//
//  AppDelegate+Insider.m
//  Insider Test App
//
//  Created by Luis Bouça on 20/01/2023.
//

#import "AppDelegate+Insider.h"
#import <objc/runtime.h>
#import "InsiderPlugin.h"

@implementation AppDelegate (InsiderPlugin)

// Borrowed from http://nshipster.com/method-swizzling/
+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class class = [self class];

        SEL originalSelector = @selector(application:didFinishLaunchingWithOptions:);
        SEL swizzledSelector = @selector(insider_application:didFinishLaunchingWithOptions:);

        Method originalMethod = class_getInstanceMethod(class, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

        BOOL didAddMethod =
        class_addMethod(class,
                        originalSelector,
                        method_getImplementation(swizzledMethod),
                        method_getTypeEncoding(swizzledMethod));

        if (didAddMethod) {
            class_replaceMethod(class,
                                swizzledSelector,
                                method_getImplementation(originalMethod),
                                method_getTypeEncoding(originalMethod));
        } else {
            method_exchangeImplementations(originalMethod, swizzledMethod);
        }
    });
}

- (BOOL)insider_application:(UIApplication*)application
    didFinishLaunchingWithOptions:(NSDictionary*)launchOptions
{
    BOOL handled = [self insider_application:application didFinishLaunchingWithOptions:launchOptions];
    UNUserNotificationCenter.currentNotificationCenter.delegate = self;
    [Insider registerInsiderCallbackWithSelector:@selector(insiderCallback:) sender:self];
    
    return handled;
}

-(void)setActiveForegroundPushView{
    @try {
        [Insider setActiveForegroundPushView];
    } @catch (NSException *e) {
        [Insider sendError:e desc:[NSString stringWithFormat:@"Insider.m - setActiveForegroundPushView"]];
    }
}


-(void)insiderCallback:(NSDictionary *)notfDict {
    
    @try {
        if (!notfDict || [notfDict count] == 0)
            return;
        
        InsiderCallbackType type = (InsiderCallbackType)[[notfDict objectForKey:@"type"] intValue];
        
        NSError *error;
        NSData *notfData = [NSJSONSerialization dataWithJSONObject:notfDict options:0 error:&error];

        CDVPluginResult * result = nil;
        if (! notfData) {
            NSLog(@"Got an error: %@", error);
        } else {
            NSString *notifString = [[NSString alloc] initWithData:notfData encoding:NSUTF8StringEncoding];
            switch (type) {
                case InsiderCallbackTypeNotificationOpen:{
                    NSString * data = [NSString stringWithFormat:@"{""action"":'NOTIFICATION_OPEN',""result"":""%@""}", notifString];
                    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:data];
                    break;
                }
                case InsiderCallbackTypeTempStoreCustomAction:{
                    NSString * data = [NSString stringWithFormat:@"{""action"":'TEMP_STORE_CUSTOM_ACTION',""result"":""%@""}", notifString];
                    result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:data];
                    break;
                }
                default:
                break;
            }
            [result setKeepCallbackAsBool:YES];
            InsiderPlugin* insiderPlugin = [self.viewController getCommandInstance:@"InsiderPlugin"];
            [insiderPlugin sendPluginResult:result];
        }
        
    } @catch (NSException *e){
        [Insider sendError:e desc:[NSString stringWithFormat:@"%s:%d", __func__, __LINE__]];
    }
}

@end
