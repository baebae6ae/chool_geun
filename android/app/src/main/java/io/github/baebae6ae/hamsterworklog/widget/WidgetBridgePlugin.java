package io.github.baebae6ae.hamsterworklog.widget;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.os.Build;
import android.util.Base64;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.RemoteViews;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Iterator;

/** 웹(앱 화면) → 홈 화면 위젯 연결 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    /** 앞으로의 위젯 상태 목록과 (바뀌었으면) 캐릭터 그림을 저장하고 위젯을 다시 그린다 */
    @PluginMethod
    public void update(PluginCall call) {
        Context c = getContext();
        try {
            String timeline = call.getString("timeline");
            if (timeline != null) WidgetRenderer.saveTimeline(c, timeline);
            JSObject images = call.getObject("images", null);
            if (images != null) {
                File dir = WidgetRenderer.imageDir(c);
                if (!dir.exists()) dir.mkdirs();
                Iterator<String> keys = images.keys();
                while (keys.hasNext()) {
                    String key = keys.next();
                    if (!key.matches("[A-Za-z]{1,20}")) continue;
                    byte[] bytes = Base64.decode(images.getString(key), Base64.DEFAULT);
                    try (FileOutputStream out = new FileOutputStream(new File(dir, key + ".png"))) {
                        out.write(bytes);
                    }
                }
            }
            WidgetRenderer.updateAll(c);
            call.resolve();
        } catch (Exception e) {
            call.reject("위젯 갱신 실패: " + e);
        }
    }

    /** 점검용: 위젯을 실제와 같은 방식으로 그려 PNG로 돌려준다 */
    @PluginMethod
    public void preview(PluginCall call) {
        final boolean wide = !"small".equals(call.getString("size", "wide"));
        Double nowD = call.getDouble("now");
        final long now = nowD != null ? nowD.longValue() : System.currentTimeMillis();
        final String tlStr = call.getString("timeline");
        final int wDp = call.getInt("width", wide ? 330 : 170);
        final int hDp = call.getInt("height", wide ? 100 : 170);
        getBridge().executeOnMainThread(() -> {
            try {
                // 액티비티의 AppCompat 인플레이터를 피하려고 앱 컨텍스트로 그린다 (런처와 같은 조건)
                Context c = getContext().getApplicationContext();
                JSONArray tl = tlStr != null ? new JSONArray(tlStr) : WidgetRenderer.load(c);
                RemoteViews rv = WidgetRenderer.build(c, wide, tl, now);
                FrameLayout parent = new FrameLayout(c);
                View v = rv.apply(c, parent);
                float d = c.getResources().getDisplayMetrics().density;
                int w = Math.round(wDp * d), h = Math.round(hDp * d);
                v.measure(View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY),
                        View.MeasureSpec.makeMeasureSpec(h, View.MeasureSpec.EXACTLY));
                v.layout(0, 0, w, h);
                Bitmap bm = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
                v.draw(new Canvas(bm));
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                bm.compress(Bitmap.CompressFormat.PNG, 100, out);
                JSObject r = new JSObject();
                r.put("png", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
                call.resolve(r);
            } catch (Exception e) {
                call.reject("위젯 미리보기 실패: " + e);
            }
        });
    }

    /** 홈 화면에 위젯 추가를 요청한다 (런처가 지원할 때만, 사용자가 확인해야 추가됨) */
    @PluginMethod
    public void pin(PluginCall call) {
        JSObject r = new JSObject();
        boolean ok = false;
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                Context c = getContext();
                AppWidgetManager m = c.getSystemService(AppWidgetManager.class);
                Class<?> cls = "small".equals(call.getString("size", "wide")) ? HamsterWidgetSmall.class : HamsterWidgetWide.class;
                ok = m != null && m.isRequestPinAppWidgetSupported() && m.requestPinAppWidget(new ComponentName(c, cls), null, null);
            }
        } catch (Exception ignored) {
        }
        r.put("ok", ok);
        call.resolve(r);
    }
}
