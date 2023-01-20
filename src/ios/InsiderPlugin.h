#import <InsiderMobile/Insider.h>
#import <InsiderMobile/InsiderCallbackTypeEnum.h>

@interface InsiderPlugin : CDVPlugin {
}
- (void) init:(CDVInvokedUrlCommand *)command;
- (void) registerWithQuietPermission:(CDVInvokedUrlCommand *)command;
- (void) setGDPRConsent:(CDVInvokedUrlCommand *)command;
- (void) startTrackingGeofence:(CDVInvokedUrlCommand *)command;
- (void) tagEvent:(CDVInvokedUrlCommand *)command;
- (void) setPushOptin:(CDVInvokedUrlCommand *)command;
- (void) setActiveForegroundPushView:(CDVInvokedUrlCommand *)command;
- (void) setLanguage:(CDVInvokedUrlCommand *)command;
- (void) setUser:(CDVInvokedUrlCommand *)command;
- (void) setCustomAttribute:(CDVInvokedUrlCommand *)command;

-(void) sendPluginResult:(CDVPluginResult*) result;
@end
