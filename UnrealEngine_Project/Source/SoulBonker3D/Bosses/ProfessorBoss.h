#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "ProfessorBoss.generated.h"

UENUM(BlueprintType)
enum class EProfBossState : uint8
{
	Idle,
	Chasing,
	Telegraphing,
	Attacking,
	Enraged,
	Dead
};

UCLASS()
class SOULBONKER3D_API AProfessorBoss : public ACharacter
{
	GENERATED_BODY()

public:
	AProfessorBoss();

	virtual void BeginPlay() override;
	virtual void Tick(float DeltaTime) override;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
	float MaxHealth = 1800.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Stats")
	float CurrentHealth = 1800.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
	float BaseDamage = 40.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "State")
	bool bIsEnraged = false;

	UFUNCTION(BlueprintCallable, Category = "Combat")
	void AttackSilenceDansLAmphi();

	UFUNCTION(BlueprintCallable, Category = "Combat")
	void AttackDistributionCopies();

	UFUNCTION(BlueprintCallable, Category = "Combat")
	void TriggerEnragePhase();

	UFUNCTION(BlueprintCallable, Category = "Combat")
	void TakeBonkDamage(float DamageAmount, FVector HitDirection, float KnockbackForce);
};
