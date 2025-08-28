import os
import re

addons_path = "custom_addons"

# regex bắt 'version': '...'
version_pattern = re.compile(r"'version'\s*:\s*'([^']*)'")

for root, dirs, files in os.walk(addons_path):
    if "__manifest__.py" in files:
        manifest_path = os.path.join(root, "__manifest__.py")
        with open(manifest_path, "r", encoding="utf-8") as f:
            content = f.read()

        match = version_pattern.search(content)
        if match:
            old_version = match.group(1)
            parts = old_version.split(".")
            if parts[0] != "18":  # chỉ sửa nếu không phải 18
                # đổi số major thành 18
                parts[0] = "18"
                new_version = ".".join(parts)
                new_content = content.replace(old_version, new_version)
                with open(manifest_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"✔ {manifest_path} : {old_version}  →  {new_version}")
            else:
                print(f"= {manifest_path} : version đã đúng ({old_version})")
