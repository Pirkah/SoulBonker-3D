using UnrealBuildTool;

public class SoulBonker3D : ModuleRules
{
	public SoulBonker3D(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[] { 
			"Core", 
			"CoreUObject", 
			"Engine", 
			"InputCore", 
			"EnhancedInput",
			"Niagara",
			"GameplayTasks"
		});

		PrivateDependencyModuleNames.AddRange(new string[] {  });
	}
}
