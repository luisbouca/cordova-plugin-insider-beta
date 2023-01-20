//
//  AppDelegate+Insider.h
//  Insider Test App
//
//  Created by Luis Bouça on 20/01/2023.
//
#ifndef AppDelegate_Insider_h
#define AppDelegate_Insider_h

#import "AppDelegate.h"
#import <UserNotifications/UNUserNotificationCenter.h>
#import <NotificationCenter/NotificationCenter.h>
#import <InsiderMobile/Insider.h>

@interface AppDelegate (InsiderPlugin) <UNUserNotificationCenterDelegate>

-(void)setActiveForegroundPushView;

@end

#endif /* AppDelegate_Insider_h */
