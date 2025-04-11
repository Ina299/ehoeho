import bpy
import sys
import os

# コマンドライン引数から入力ファイルパスと出力ファイルパスを取得
# スクリプト実行時の引数は '--' の後に続く
argv = sys.argv
try:
    argv = argv[argv.index("--") + 1:]  # '--' 以降の引数を取得
except ValueError:
    argv = [] # '--' がない場合は空リスト

if len(argv) < 2:
    print("Error: Missing input blend file or output glb file path.")
    print("Usage: blender --background --python export_glb.py -- <input_blend_file> <output_glb_file>")
    # Blenderがエラーコードで終了するようにする
    # sys.exit(1) はバックグラウンドモードでは期待通りに動作しないことがあるため、
    # bpy.ops.wm.quit_blender() を呼ぶ前にエラーメッセージを出力する
    bpy.ops.wm.quit_blender()


input_blend_file = argv[0]
output_glb_file = argv[1]

# Blenderファイルを開く
try:
    # 絶対パスに変換
    abs_input_blend_file = os.path.abspath(input_blend_file)
    if not os.path.exists(abs_input_blend_file):
        print(f"Error: Input file not found at {abs_input_blend_file}")
        bpy.ops.wm.quit_blender()

    bpy.ops.wm.open_mainfile(filepath=abs_input_blend_file)
    print(f"Opened blend file: {abs_input_blend_file}")

except Exception as e:
    print(f"Error opening blend file '{input_blend_file}': {e}")
    bpy.ops.wm.quit_blender()


# GLB形式でエクスポート
try:
    # 出力パスを絶対パスに変換
    abs_output_glb_file = os.path.abspath(output_glb_file)
    output_dir = os.path.dirname(abs_output_glb_file)

    # 出力ディレクトリが存在しない場合は作成
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")

    print(f"Exporting to GLB: {abs_output_glb_file}")
    bpy.ops.export_scene.gltf(
        filepath=abs_output_glb_file,
        export_format='GLB',
        use_selection=False,  # シーン全体をエクスポート
        export_apply=True, # モディファイアを適用
        export_animations=True, # アニメーションをエクスポート (明示的に指定)
        # その他のエクスポートオプションは必要に応じて追加
        # export_cameras=True,
        # export_lights=True,
    )
    print(f"Successfully exported {abs_input_blend_file} to {abs_output_glb_file}")

except Exception as e:
    print(f"Error exporting to GLB: {e}")
    # エラーが発生した場合でもBlenderを終了させる
    bpy.ops.wm.quit_blender()


# Blenderを正常終了
print("Exiting Blender.")
# bpy.ops.wm.quit_blender() # スクリプトの最後に自動的に終了するため、通常は不要