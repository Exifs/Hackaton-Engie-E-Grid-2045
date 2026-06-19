extends SceneTree

const SIMULATION_CORE := preload("res://scripts/simulation/SimulationCore.gd")


func _init() -> void:
	var core := SIMULATION_CORE.new()
	root.add_child(core)
	core.new_game()
	core.set_simulation_speed(0.0)
	core.select_region("fr_sud")

	var start_money := float(core.get_summary().get("money", 0.0))
	var build_result: Dictionary = core.request_building("fr_sud", "solar_farm")
	if not bool(build_result.get("ok", false)):
		_fail("solar_farm should be buildable in fr_sud: %s" % build_result.get("reason", ""))
		return

	if float(core.get_summary().get("money", 0.0)) >= start_money:
		_fail("starting construction should spend money")
		return

	for _month in range(5):
		core.advance_month()

	var region: Dictionary = core.get_region_snapshot("fr_sud")
	if not (region.get("buildings", []) as Array).has("solar_farm"):
		_fail("solar_farm should complete after 5 simulated months")
		return

	var cached: Dictionary = region.get("cached", {})
	if float(cached.get("energy_production", 0.0)) <= 0.0:
		_fail("completed construction should contribute to regional energy state")
		return

	print("E-Grid gameplay smoke test passed.")
	quit(0)


func _fail(message: String) -> void:
	push_error(message)
	quit(1)
