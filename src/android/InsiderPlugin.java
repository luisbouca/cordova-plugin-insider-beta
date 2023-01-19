package insider.cordova.insider;

import com.useinsider.insider.Insider;
import com.useinsider.insider.InsiderCallback;
import com.useinsider.insider.InsiderCallbackType;
import com.useinsider.insider.InsiderGender;
import com.useinsider.insider.InsiderIdentifiers;
import com.useinsider.insider.InsiderUser;
import com.useinsider.insider.ContentOptimizerDataType;

import com.google.firebase.iid.FirebaseInstanceId;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.apache.cordova.CordovaPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.util.Log;

import java.text.ParseException;
import java.text.ParsePosition;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Date;

public class InsiderPlugin extends CordovaPlugin {
    private String partnerName = "";
    private static final String TAG = "Insider Cordova Plugin";
    private CallbackContext callbackContext;

    @Override
    protected void pluginInitialize() {
        Log.d(TAG, "Initialized");

        Insider.Instance.init(
            this.cordova.getActivity().getApplication(),
            partnerName
        );
        Insider.Instance.registerInsiderCallback(new InsiderCallback() {
            @Override
            public void doAction(JSONObject jsonObject, InsiderCallbackType callbackType) {
                if (callbackContext == null){
                    return;
                }
                String json = "{'action':'" + callbackType + "','result':" + jsonObject.toString() + "}";
                PluginResult result = new PluginResult(PluginResult.Status.OK,json);
                result.setKeepCallback(true);
                callbackContext.sendPluginResult(result);
            }
        });
    }

    @Override
    public boolean execute(String action, final JSONArray args, final CallbackContext callbackContext) {
        if (args == null) {
            return false;
        }

        try {
            if (action.equals("init")) {
                Insider.Instance.init(
                    this.cordova.getActivity().getApplication(),
                    partnerName
                );
                Log.d(TAG, "Partner Name:" +partnerName);
            } else if (action.equals("setGDPRConsent")) {
                Insider.Instance.setGDPRConsent(Boolean.parseBoolean(args.getString(0)));
            } else if (action.equals("startTrackingGeofence")) {
                Insider.Instance.startTrackingGeofence();
            } else if (action.equals("tagEvent")) {
                Insider.Instance.tagEvent(args.getString(0)).build();
            } else if (action.equals("getContentStringWithName")) {
                ContentOptimizerDataType stringVariableDataType = getDataType(args.getString(2));

                String optimizedString = Insider.Instance.getContentStringWithName(args.getString(0), args.getString(1), stringVariableDataType);

                if (optimizedString != null && optimizedString.length() > 0) {
                    callbackSuccess(callbackContext, optimizedString);
                }
            } else if (action.equals("getContentIntWithName")) {
                ContentOptimizerDataType intVariableDataType = getDataType(args.getString(2));

                int optimizedInteger = Insider.Instance.getContentIntWithName(args.getString(0), args.getInt(1), intVariableDataType);

                callbackSuccess(callbackContext, optimizedInteger);
            } else if (action.equals("getContentBoolWithName")) {
                ContentOptimizerDataType boolVariableDataType = getDataType(args.getString(2));

                boolean optimizedBoolean = Insider.Instance.getContentBoolWithName(args.getString(0), args.getBoolean(1), boolVariableDataType);

                callbackSuccess(callbackContext, optimizedBoolean);
            } else if (action.equals("removeInapp")) {
                Insider.Instance.removeInapp(this.cordova.getActivity());
            } else if (action.equals("setPushOptin")) {
                if (args.get(0) == null)
                    return false;

                Insider.Instance.getCurrentUser().setPushOptin(args.getBoolean(0));
            } else if(action.equals("setLanguage")){
                if (args.get(0) == null){
                    return false;
                }
                Insider.Instance.getCurrentUser().setLanguage(args.getString(0));
            }else if(action.equals("setUser")){
                if (args.get(0) == null){
                    return false;
                }
                setUser(args.getJSONObject(0));
            }else if(action.equals("setCustomAttribute")){
                if (args.get(0) == null){
                    return false;
                }
                JSONObject keyValue = args.getJSONObject(0);
                Insider.Instance.getCurrentUser().setCustomAttributeWithString(keyValue.getString("Key"),keyValue.getString("Value"));
            }else if(action.equals("removeCustomAttribute")){
                if (args.get(0) == null){
                    return false;
                }
                Insider.Instance.getCurrentUser().unsetCustomAttribute(args.getString(0));
            }else if(action.equals("setCallback")){
                return false;
            }

            return true;
        } catch (Exception e) {
            Insider.Instance.putException(e);
            return false;
        }
    }

    private void setUser(JSONObject user) throws ParseException {
        InsiderIdentifiers identifier = new InsiderIdentifiers();
        for (int i = 0; i < user.length(); i++) {

            String email = user.optString("email","null");
            if (!email.equals("null")){
                identifier.addEmail(email);
            }
            String phoneNumber = user.optString("phoneNumber","null");
            if (!phoneNumber.equals("null")){
                identifier.addPhoneNumber(phoneNumber);
            }
            String userID = user.optString("userID","null");
            if (!userID.equals("null")){
                identifier.addUserID(userID);
            }
            Insider.Instance.getCurrentUser().login(identifier);

            String birthday = user.optString("birthday","null");
            if (!birthday.equals("null")){
                SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
                Date birthdayDate = formatter.parse(birthday);
                Insider.Instance.getCurrentUser().setBirthday(birthdayDate);
            }

            String name = user.optString("name","null");
            if (!name.equals("null")){
                Insider.Instance.getCurrentUser().setName(name);
            }
            String surname = user.optString("surname","null");
            if (!surname.equals("null")){
                Insider.Instance.getCurrentUser().setSurname(surname);
            }

            String gender = user.optString("gender","null");
            if (!gender.equals("null")){
                switch (gender){
                    default:
                        Insider.Instance.getCurrentUser().setGender(InsiderGender.OTHER);
                        break;
                    case "female":
                        Insider.Instance.getCurrentUser().setGender(InsiderGender.FEMALE);
                        break;
                    case "male":
                        Insider.Instance.getCurrentUser().setGender(InsiderGender.MALE);
                        break;
                }
            }

            int age = user.optInt("age",0);
            if (!(age == 0)){
                Insider.Instance.getCurrentUser().setAge(age);
            }
        }
    }

    private static ContentOptimizerDataType getDataType(String dataType){
        if (dataType.equals("Content")) {
            return ContentOptimizerDataType.CONTENT;
        } else {
            return ContentOptimizerDataType.ELEMENT;
        }
    }

    private static void callbackSuccess(CallbackContext callbackContext, String callbackValue) {
        try {
            PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, callbackValue);

            pluginResult.setKeepCallback(true);

            callbackContext.sendPluginResult(pluginResult);
        } catch (Exception e) {
            Insider.Instance.putException(e);
        }
    }

    private static void callbackSuccess(CallbackContext callbackContext, int callbackValue) {
        try {
            PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, callbackValue);

            pluginResult.setKeepCallback(true);

            callbackContext.sendPluginResult(pluginResult);
        } catch (Exception e) {
            Insider.Instance.putException(e);
        }
    }

    private static void callbackSuccess(CallbackContext callbackContext, boolean callbackValue) {
        try {
            PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, callbackValue);

            pluginResult.setKeepCallback(true);

            callbackContext.sendPluginResult(pluginResult);
        } catch (Exception e) {
            Insider.Instance.putException(e);
        }
    }
}