package io.github.baebae6ae.hamsterworklog.widget;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.text.NumberFormat;
import java.util.Calendar;
import java.util.Locale;

import io.github.baebae6ae.hamsterworklog.MainActivity;
import io.github.baebae6ae.hamsterworklog.R;

/**
 * 홈 화면 위젯을 그린다.
 * 앱이 넘겨 둔 "앞으로의 상태 목록"(timeline)에서 지금 시각에 해당하는 항목을 골라 그리기만 하고,
 * 다음 상태가 시작되는 시각에 다시 그리도록 알람을 하나 걸어 둔다 (화면이 꺼져 있으면 깨우지 않는다).
 * 위젯을 누르면 항상 앱이 열린다.
 */
public final class WidgetRenderer {
    static final String PREFS = "hamster_widget";
    static final String KEY_TIMELINE = "timeline";
    static final String ACTION_TICK = "io.github.baebae6ae.hamsterworklog.WIDGET_TICK";
    /** 돈이 올라가는 동안은 이 간격으로 금액을 고쳐 그린다 (화면이 켜져 있을 때만) */
    private static final long MONEY_REFRESH_MS = 15 * 60_000L;

    private WidgetRenderer() {}

    public static void saveTimeline(Context c, String json) {
        prefs(c).edit().putString(KEY_TIMELINE, json).apply();
    }

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static File imageDir(Context c) {
        return new File(c.getFilesDir(), "widget");
    }

    public static JSONArray load(Context c) {
        try {
            String s = prefs(c).getString(KEY_TIMELINE, null);
            return s == null ? new JSONArray() : new JSONArray(s);
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    /** 놓여 있는 모든 위젯을 다시 그리고 다음 갱신을 예약한다 */
    public static void updateAll(Context c) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            int[] wide = m.getAppWidgetIds(new ComponentName(c, HamsterWidgetWide.class));
            int[] small = m.getAppWidgetIds(new ComponentName(c, HamsterWidgetSmall.class));
            JSONArray tl = load(c);
            long now = System.currentTimeMillis();
            for (int id : wide) m.updateAppWidget(id, build(c, true, tl, now));
            for (int id : small) m.updateAppWidget(id, build(c, false, tl, now));
            if (wide.length + small.length > 0) scheduleNext(c, tl, now);
            else cancel(c);
        } catch (Exception ignored) {
            // 위젯이 실패해도 앱은 영향받지 않게
        }
    }

    static JSONObject current(JSONArray tl, long now) {
        JSONObject cur = null;
        for (int i = 0; i < tl.length(); i++) {
            JSONObject e = tl.optJSONObject(i);
            if (e == null) continue;
            if ((long) e.optDouble("at", 0) <= now) cur = e;
            else break;
        }
        return cur;
    }

    private static final int INK_LIGHT = 0xFF4A3226, SUB_LIGHT = 0xFF9A7A62;
    private static final int INK_DARK = 0xFFFFF6E0, SUB_DARK = 0xFFD2D6BC;

    private static boolean isDark(String theme) {
        return theme.equals("night") || theme.startsWith("rot");
    }

    private static int background(String theme) {
        switch (theme) {
            case "morning": return R.drawable.widget_bg_morning;
            case "night": return R.drawable.widget_bg_night;
            case "off": return R.drawable.widget_bg_off;
            case "rot1": return R.drawable.widget_bg_rot1;
            case "rot2": return R.drawable.widget_bg_rot2;
            case "rot3": return R.drawable.widget_bg_rot3;
            case "rot4": return R.drawable.widget_bg_rot4;
            default: return R.drawable.widget_bg_day;
        }
    }

    public static RemoteViews build(Context c, boolean wide, JSONArray tl, long now) {
        RemoteViews v = new RemoteViews(c.getPackageName(), wide ? R.layout.widget_wide : R.layout.widget_small);
        v.setOnClickPendingIntent(R.id.widget_root, openApp(c));
        JSONObject e = current(tl, now);
        if (e == null) {
            // 앱을 아직 열지 않았거나 기록이 없음
            v.setInt(R.id.widget_root, "setBackgroundResource", R.drawable.widget_bg_day);
            v.setImageViewResource(R.id.widget_char, R.drawable.widget_char_default);
            v.setViewVisibility(R.id.widget_mold, View.GONE);
            v.setTextViewText(R.id.widget_label, "햄스터 출근일지");
            v.setViewVisibility(R.id.widget_chrono, View.GONE);
            v.setViewVisibility(R.id.widget_big, View.VISIBLE);
            v.setTextViewText(R.id.widget_big, "앱을 열어 주세요");
            if (wide) {
                v.setViewVisibility(R.id.widget_side, View.GONE);
                v.setViewVisibility(R.id.widget_progress, View.GONE);
            } else {
                v.setTextViewText(R.id.widget_status, "눌러서 시작하기");
            }
            return v;
        }

        String theme = e.optString("theme", "day");
        boolean dark = isDark(theme);
        int ink = dark ? INK_DARK : INK_LIGHT;
        int sub = dark ? SUB_DARK : SUB_LIGHT;
        v.setInt(R.id.widget_root, "setBackgroundResource", background(theme));
        if (theme.equals("rot3")) {
            v.setViewVisibility(R.id.widget_mold, View.VISIBLE);
            v.setImageViewResource(R.id.widget_mold, R.drawable.widget_mold_1);
        } else if (theme.equals("rot4")) {
            v.setViewVisibility(R.id.widget_mold, View.VISIBLE);
            v.setImageViewResource(R.id.widget_mold, R.drawable.widget_mold_2);
        } else if (theme.equals("rot2")) {
            v.setViewVisibility(R.id.widget_mold, View.VISIBLE);
            v.setImageViewResource(R.id.widget_mold, R.drawable.widget_mold_1);
        } else {
            v.setViewVisibility(R.id.widget_mold, View.GONE);
        }

        // 캐릭터: 앱이 사용자의 꾸미기 그대로 그려 넘겨 둔 그림
        Bitmap bm = null;
        try {
            File f = new File(imageDir(c), e.optString("img", "type") + ".png");
            if (f.exists()) bm = BitmapFactory.decodeFile(f.getAbsolutePath());
        } catch (Exception ignored) {
        }
        if (bm != null) v.setImageViewBitmap(R.id.widget_char, bm);
        else v.setImageViewResource(R.id.widget_char, R.drawable.widget_char_default);

        v.setTextViewText(R.id.widget_label, e.optString("label", ""));
        v.setTextColor(R.id.widget_label, sub);

        JSONObject chrono = e.optJSONObject("chrono");
        if (chrono != null) {
            long target = (long) chrono.optDouble("target", now);
            boolean down = chrono.optBoolean("down", true);
            long base = SystemClock.elapsedRealtime() + (target - now);
            v.setViewVisibility(R.id.widget_big, View.GONE);
            v.setViewVisibility(R.id.widget_chrono, View.VISIBLE);
            v.setChronometer(R.id.widget_chrono, base, null, true);
            v.setChronometerCountDown(R.id.widget_chrono, down);
            v.setTextColor(R.id.widget_chrono, ink);
        } else {
            v.setViewVisibility(R.id.widget_chrono, View.GONE);
            v.setViewVisibility(R.id.widget_big, View.VISIBLE);
            v.setTextViewText(R.id.widget_big, e.optString("big", ""));
            v.setTextColor(R.id.widget_big, ink);
        }

        if (!wide) {
            v.setTextViewText(R.id.widget_status, e.optString("status", ""));
            v.setTextColor(R.id.widget_status, sub);
            return v;
        }

        JSONObject progress = e.optJSONObject("progress");
        if (progress != null) {
            double from = progress.optDouble("from", now), to = progress.optDouble("to", now);
            int p = to > from ? (int) Math.max(0, Math.min(1000, (now - from) * 1000 / (to - from))) : 0;
            v.setViewVisibility(R.id.widget_progress, View.VISIBLE);
            v.setProgressBar(R.id.widget_progress, 1000, p, false);
        } else {
            v.setViewVisibility(R.id.widget_progress, View.GONE);
        }

        JSONObject side = e.optJSONObject("side");
        if (side == null) {
            v.setViewVisibility(R.id.widget_side, View.GONE);
            return v;
        }
        v.setViewVisibility(R.id.widget_side, View.VISIBLE);
        v.setTextViewText(R.id.widget_side_label, side.optString("label", ""));
        v.setTextColor(R.id.widget_side_label, sub);
        String value = side.optString("value", "");
        JSONObject money = side.optJSONObject("money");
        if (money != null) {
            double val = money.optDouble("base", 0)
                    + money.optDouble("perMin", 0) * Math.max(0, now - money.optDouble("at", now)) / 60_000.0;
            val = Math.min(val, money.optDouble("cap", val));
            value = "₩ " + NumberFormat.getIntegerInstance(Locale.KOREA).format((long) Math.floor(val));
        }
        v.setTextViewText(R.id.widget_side_value, value);
        String tone = side.optString("tone", "normal");
        int valueColor = ink;
        if (tone.equals("red")) valueColor = dark ? 0xFFFF8A7A : 0xFFC9372C;
        else if (tone.equals("green")) valueColor = dark ? 0xFFB9F0A0 : 0xFF3F7C4B;
        v.setTextColor(R.id.widget_side_value, valueColor);
        String note = side.optString("note", "");
        if (side.optBoolean("stamp", false)) note = hm(now) + " 기준 · " + note;
        v.setTextViewText(R.id.widget_side_note, note);
        v.setTextColor(R.id.widget_side_note, sub);
        v.setViewVisibility(R.id.widget_side_note, note.isEmpty() ? View.GONE : View.VISIBLE);
        return v;
    }

    private static String hm(long t) {
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(t);
        return String.format(Locale.KOREA, "%02d:%02d", cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE));
    }

    private static PendingIntent openApp(Context c) {
        Intent i = new Intent(c, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent tick(Context c) {
        Intent i = new Intent(c, WidgetTickReceiver.class);
        i.setAction(ACTION_TICK);
        return PendingIntent.getBroadcast(c, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** 다음 상태가 시작되는 시각(돈이 오르는 중이면 15분 뒤 중 빠른 쪽)에 다시 그린다. 기기를 깨우지 않는다 */
    static void scheduleNext(Context c, JSONArray tl, long now) {
        long next = Long.MAX_VALUE;
        for (int i = 0; i < tl.length(); i++) {
            JSONObject e = tl.optJSONObject(i);
            if (e == null) continue;
            long at = (long) e.optDouble("at", 0);
            if (at > now) {
                next = at;
                break;
            }
        }
        JSONObject cur = current(tl, now);
        JSONObject side = cur == null ? null : cur.optJSONObject("side");
        JSONObject money = side == null ? null : side.optJSONObject("money");
        if (money != null && money.optDouble("perMin", 0) > 0) next = Math.min(next, now + MONEY_REFRESH_MS);
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        if (next == Long.MAX_VALUE) {
            am.cancel(tick(c));
            return;
        }
        am.setWindow(AlarmManager.RTC, next, 30_000L, tick(c));
    }

    static void cancel(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(tick(c));
    }
}
