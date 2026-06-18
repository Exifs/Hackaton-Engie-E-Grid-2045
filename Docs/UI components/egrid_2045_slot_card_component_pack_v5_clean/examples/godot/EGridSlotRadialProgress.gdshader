shader_type canvas_item;

uniform float progress : hint_range(0.0, 1.0) = 0.0;
uniform float inner_radius : hint_range(0.0, 0.5) = 0.36;
uniform float outer_radius : hint_range(0.0, 0.5) = 0.46;
uniform vec4 fill_color : source_color = vec4(0.22, 0.85, 0.91, 1.0);
uniform vec4 under_color : source_color = vec4(0.12, 0.20, 0.23, 0.75);

void fragment() {
	vec2 p = UV - vec2(0.5);
	float r = length(p);
	float angle = atan(p.x, -p.y) / 6.28318530718 + 0.5;
	float ring = smoothstep(inner_radius, inner_radius + 0.006, r) * (1.0 - smoothstep(outer_radius - 0.006, outer_radius, r));
	float a = step(angle, progress);
	vec4 col = mix(under_color, fill_color, a);
	COLOR = vec4(col.rgb, col.a * ring);
}
