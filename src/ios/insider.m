#import <Cordova/CDV.h>
#import "Insider.h"

@interface insider : CDVPlugin {

}

- (void) init:(CDVInvokedUrlCommand *)command;
- (void) registerWithQuietPermission:(CDVInvokedUrlCommand *)command;
- (void) enableIDFACollection:(CDVInvokedUrlCommand *)command;
- (void) setGDPRConsent:(CDVInvokedUrlCommand *)command;
- (void) startTrackingGeofence:(CDVInvokedUrlCommand *)command;
- (void) tagEvent:(CDVInvokedUrlCommand *)command;
- (void) setPushOptin:(CDVInvokedUrlCommand *)command;
- (void) setActiveForegroundPushView:(CDVInvokedUrlCommand *)command;
- (void) setLanguage:(CDVInvokedUrlCommand *)command;
- (void) setUser:(CDVInvokedUrlCommand *)command;
- (void) setCustomAttribute:(CDVInvokedUrlCommand *)command;
- (void) removeCustomAttribute:(CDVInvokedUrlCommand *)command;
@end

@implementation insider

// The variable for your app group name that you will use to init the SDK.
static NSString *APP_GROUP = @"group.com.useinsider.plugin";

- (void) pluginInitialize {
    NSLog(@"Insider Cordova Plugin: Initialized");
}

- (void) init:(CDVInvokedUrlCommand *)command {
    @try {
        NSString* partnerName = [[command arguments] objectAtIndex:0];
        
        [Insider initWithLaunchOptions:nil partnerName:partnerName appGroup:APP_GROUP];
    } @catch (NSException *exception) {
        [Insider sendError:exception desc:@"insider.m - init"];
    }
}

- (void) registerWithQuietPermission:(CDVInvokedUrlCommand *)command {
    @try {
        NSString* booleanValueByString = [[command arguments] objectAtIndex:0];
        
        [Insider registerWithQuietPermission:[booleanValueByString isEqualToString: @"true"]];
    } @catch (NSException *exception) {
        [Insider sendError:exception desc:@"insider.m - registerWithQuietPermission"];
    }
}

- (void) enableIDFACollection:(CDVInvokedUrlCommand *)command {
    @try {
        NSString* booleanValueByString = [[command arguments] objectAtIndex:0];
        
        [Insider enableIDFACollection:[booleanValueByString isEqualToString: @"true"]];
    } @catch (NSException *exception) {
        [Insider sendError:exception desc:@"insider.m - enableIDFACollection"];
    }
}

- (void) setGDPRConsent:(CDVInvokedUrlCommand *)command {
    @try {
        NSString* booleanValueByString = [[command arguments] objectAtIndex:0];
        
        [Insider setGDPRConsent:[booleanValueByString isEqualToString: @"true"]];
    } @catch (NSException *exception) {
        [Insider sendError:exception desc:@"insider.m - setGDPRConsent"];
    }
}

- (void) startTrackingGeofence:(CDVInvokedUrlCommand *)command {
    @try {
        [Insider startTrackingGeofence];
    } @catch (NSException *exception) {
        [Insider sendError:exception desc:@"insider.m - startTrackingGeofence"];
    }
}

- (void) tagEvent:(CDVInvokedUrlCommand *)command {
    @try {
        NSString* eventName = [[command arguments] objectAtIndex:0];
        
        [[Insider tagEvent:eventName] build];
    } @catch (NSException *exception) {
        [Insider sendError:exception desc:@"insider.m - tagEvent"];
    }
}

- (void) removeInapp:(CDVInvokedUrlCommand *)command {
    @try {
        [Insider removeInapp];
    } @catch (NSException *exception) {
        [Insider sendError:exception desc:@"insider.m - tagEvent"];
    }
}

- (void)setPushOptin:(CDVInvokedUrlCommand *)command {
    @try {
        if (![command.arguments objectAtIndex:0]) return;
        [Insider getCurrentUser].setPushOptin([[command.arguments objectAtIndex:0] boolValue]);
    } @catch (NSException *e) {
        [Insider sendError:e desc:[NSString stringWithFormat:@"%s:%d", __func__, __LINE__]];
    }
}
- (void)setActiveForegroundPushView:(CDVInvokedUrlCommand *)command {
    @try {
        [Insider setActiveForegroundPushView];
    } @catch (NSException *e) {
        [Insider sendError:e desc:[NSString stringWithFormat:@"%s:%d", __func__, __LINE__]];
    }
}
- (void)setLanguage:(CDVInvokedUrlCommand *)command {
    @try {
        if (![command.arguments objectAtIndex:0]) return;
        [Insider getCurrentUser].setLanguage([[command.arguments objectAtIndex:0] stringValue]);
    } @catch (NSException *e) {
        [Insider sendError:e desc:[NSString stringWithFormat:@"%s:%d", __func__, __LINE__]];
    }
}
- (void)setUser:(CDVInvokedUrlCommand *)command {
    @try {
        if (![command.arguments objectAtIndex:0]) return;
        [self mySetUser:[command.arguments objectAtIndex:0]];
    } @catch (NSException *e) {
        [Insider sendError:e desc:[NSString stringWithFormat:@"%s:%d", __func__, __LINE__]];
    }
}
- (void)setCustomAttribute:(CDVInvokedUrlCommand *)command {
    @try {
        if (![command.arguments objectAtIndex:0]) return;
        NSDictionary* keyValue = [command.arguments objectAtIndex:0];
        [Insider getCurrentUser].setCustomAttributeWithString([keyValue valueForKey:@"Key"],[keyValue valueForKey:@"Value"]);
    } @catch (NSException *e) {
        [Insider sendError:e desc:[NSString stringWithFormat:@"%s:%d", __func__, __LINE__]];
    }
}
- (void)removeCustomAttribute:(CDVInvokedUrlCommand *)command {
    @try {
        if (![command.arguments objectAtIndex:0]) return;
        [Insider getCurrentUser].unsetCustomAttribute([[command.arguments objectAtIndex:0] stringValue]);
    } @catch (NSException *e) {
        [Insider sendError:e desc:[NSString stringWithFormat:@"%s:%d", __func__, __LINE__]];
    }
}

- (void) mySetUser:(NSDictionary*)users{
    InsiderIdentifiers *identifier = [[InsiderIdentifiers alloc] init];
    NSString* email = [[users valueForKey:@"email"] stringValue];
    if (email != nil) {
        identifier.addEmail(email);
    }
    
    NSString* phoneNumber = [[users valueForKey:@"phoneNumber"] stringValue];
    if (phoneNumber != nil) {
        identifier.addPhoneNumber(phoneNumber);
    }
    
    NSString* userID = [[users valueForKey:@"userID"] stringValue];
    if (userID != nil) {
        identifier.addUserID(userID);
    }
    
    [[Insider getCurrentUser] login:identifier];
    
    NSString* birthday = [[users valueForKey:@"birthday"] stringValue];
    if (birthday != nil) {
        NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
        [dateFormatter setDateFormat:@"yyyy-MM-dd"];
        NSDate *dateBirth = [dateFormatter dateFromString: birthday];
        [Insider getCurrentUser].setBirthday(dateBirth);
    }
    
    NSString* name = [[users valueForKey:@"name"] stringValue];
    if (name != nil) {
        [Insider getCurrentUser].setName(name);
    }
    
    NSString* surname = [[users valueForKey:@"surname"] stringValue];
    if (surname != nil) {
        [Insider getCurrentUser].setSurname(surname);
    }
    
    NSNumber* age = [users valueForKey:@"age"];
    if (age != nil) {
        [Insider getCurrentUser].setAge([age intValue]);
    }
    
    NSString* gender = [[users valueForKey:@"gender"] stringValue];
    if (gender != nil) {
        if ([gender isEqualToString:@"male"]) {
            [Insider getCurrentUser].setGender(InsiderGenderMale);
        }else if ([gender isEqualToString:@"female"]) {
            [Insider getCurrentUser].setGender(InsiderGenderFemale);
        }else{
            [Insider getCurrentUser].setGender(InsiderGenderOther);
        }
    }
}
@end
